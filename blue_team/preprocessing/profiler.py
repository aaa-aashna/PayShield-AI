"""Schema-agnostic exploratory profiling for locally supplied tabular datasets."""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Any

import numpy as np
import pandas as pd

TARGET_NAME_PATTERNS = (
    r"(^|_)(is_?fraud|fraud(_label)?|target|label|class|y)(_|$)",
    r"^tx_fraud$",
)
TIMESTAMP_NAME_PATTERNS = (
    r"(^|_)(timestamp|datetime|date(_time)?|time(_stamp)?|dt|transactiondt|tx_datetime)(_|$)",
    r"^step$",
    r"(^|_)tx_time_(seconds|days)(_|$)",
)
ENTITY_NAME_PATTERNS = (
    r"(^|_)(transaction_?id|customer_?id|terminal_?id|merchant_?id|card\d*|account_?id|user_?id|client_?id|nameorig|namedest|deviceinfo)(_|$)",
    r"^id(_\d+)?$",
)
LEAKAGE_NAME_PATTERNS = (
    r"(^|_)(newbalance|oldbalance|balance_(after|before)|is_?flagged|flagged|post_|after_tx)(_|$)",
    r"(^|_)tx_fraud_scenario(_|$)",
)


@dataclass
class DatasetProfile:
    source_path: str
    shape: dict[str, int]
    dtypes: dict[str, str]
    missingness: dict[str, dict[str, float | int]]
    target_candidates: list[dict[str, Any]]
    class_distributions: dict[str, dict[str, Any]]
    categorical_cardinality: dict[str, dict[str, int | float]]
    numerical_summaries: dict[str, dict[str, float | None]]
    timestamp_candidates: list[dict[str, Any]]
    entity_id_candidates: list[dict[str, Any]]
    duplicate_rows: dict[str, int | float]
    potential_leakage_columns: list[dict[str, Any]]
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _match_patterns(name: str, patterns: tuple[str, ...]) -> bool:
    lowered = name.lower()
    return any(re.search(pattern, lowered) for pattern in patterns)


def _is_binary_series(series: pd.Series) -> bool:
    non_null = series.dropna()
    if non_null.empty:
        return False
    unique = pd.unique(non_null)
    if len(unique) > 2:
        return False
    try:
        numeric = pd.to_numeric(non_null, errors="coerce")
        if numeric.notna().all():
            return set(numeric.unique()).issubset({0, 1})
    except (TypeError, ValueError):
        pass
    return len(unique) == 2


def _infer_target_candidates(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Identify conservative target-column candidates."""
    candidates: list[dict[str, Any]] = []

    for column in df.columns:
        series = df[column]
        reasons: list[str] = []

        if _match_patterns(column, TARGET_NAME_PATTERNS):
            reasons.append("name_pattern")

        if _is_binary_series(series):
            reasons.append("binary_values")

        # A binary column alone is not enough to call something a target.
        if "name_pattern" not in reasons:
            continue

        candidates.append(
            {
                "column": column,
                "reasons": reasons,
                "unique_values": int(series.nunique(dropna=True)),
                "dtype": str(series.dtype),
            }
        )

    return candidates


def _class_distribution(df: pd.DataFrame, column: str) -> dict[str, Any]:
    counts = df[column].value_counts(dropna=False)
    total = len(df)
    distribution = {
        str(key): {"count": int(value), "rate": float(value / total)}
        for key, value in counts.items()
    }
    return {
        "column": column,
        "total_rows": total,
        "distribution": distribution,
    }


def _categorical_cardinality(df: pd.DataFrame) -> dict[str, dict[str, int | float]]:
    result: dict[str, dict[str, int | float]] = {}
    for column in df.columns:
        series = df[column]
        if pd.api.types.is_numeric_dtype(series):
            if series.nunique(dropna=True) > min(50, max(10, len(df) * 0.05)):
                continue
        cardinality = int(series.nunique(dropna=True))
        if cardinality <= 1:
            continue
        result[column] = {
            "unique_values": cardinality,
            "missing_rate": float(series.isna().mean()),
        }
    return result


def _numerical_summaries(df: pd.DataFrame) -> dict[str, dict[str, float | None]]:
    summaries: dict[str, dict[str, float | None]] = {}
    for column in df.select_dtypes(include=[np.number]).columns:
        series = df[column]
        summaries[column] = {
            "count": int(series.count()),
            "mean": float(series.mean()) if series.count() else None,
            "std": float(series.std()) if series.count() > 1 else None,
            "min": float(series.min()) if series.count() else None,
            "25%": float(series.quantile(0.25)) if series.count() else None,
            "50%": float(series.quantile(0.50)) if series.count() else None,
            "75%": float(series.quantile(0.75)) if series.count() else None,
            "max": float(series.max()) if series.count() else None,
        }
    return summaries


def _timestamp_candidates(df: pd.DataFrame) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for column in df.columns:
        series = df[column]
        reasons: list[str] = []
        if pd.api.types.is_datetime64_any_dtype(series):
            reasons.append("datetime_dtype")
        if _match_patterns(column, TIMESTAMP_NAME_PATTERNS):
            reasons.append("name_pattern")
        if pd.api.types.is_numeric_dtype(series) and _match_patterns(column, TIMESTAMP_NAME_PATTERNS):
            reasons.append("numeric_time_name")
        if not reasons:
            if series.dtype == object:
                parsed = pd.to_datetime(series.dropna().head(100), errors="coerce")
                if parsed.notna().mean() >= 0.8:
                    reasons.append("parseable_datetime_sample")
        if reasons:
            sample = series.dropna().head(3).tolist()
            candidates.append(
                {
                    "column": column,
                    "reasons": reasons,
                    "dtype": str(series.dtype),
                    "sample_values": [str(value) for value in sample],
                }
            )
    return candidates


def _entity_id_candidates(df: pd.DataFrame) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    n_rows = len(df)
    for column in df.columns:
        series = df[column]
        nunique = series.nunique(dropna=True)
        if nunique <= 1:
            continue
        reasons: list[str] = []
        if _match_patterns(column, ENTITY_NAME_PATTERNS):
            reasons.append("name_pattern")
        if nunique >= max(20, n_rows * 0.01):
            reasons.append("high_cardinality")
        if reasons:
            candidates.append(
                {
                    "column": column,
                    "reasons": reasons,
                    "unique_values": int(nunique),
                    "duplicate_rate": float(1 - (nunique / n_rows)),
                    "dtype": str(series.dtype),
                }
            )
    return sorted(candidates, key=lambda item: item["unique_values"], reverse=True)


def _potential_leakage_columns(
    df: pd.DataFrame, target_candidates: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    flagged: list[dict[str, Any]] = []
    target_columns = [item["column"] for item in target_candidates]
    n_rows = len(df)

    for column in df.columns:
        if column in target_columns:
            continue
        reasons: list[str] = []
        if _match_patterns(column, LEAKAGE_NAME_PATTERNS):
            reasons.append("name_pattern")

        nunique = df[column].nunique(dropna=True)
        for target_col in target_columns:
            if target_col not in df.columns:
                continue

            # Low-cardinality columns that deterministically encode the label
            # (e.g., TX_FRAUD_SCENARIO) are leakage suspects on sufficiently large samples.
            if n_rows >= 100 and nunique <= 20:
                try:
                    grouped = df.groupby(column)[target_col].nunique()
                    if len(grouped) and grouped.max() == 1:
                        reasons.append(f"deterministic_mapping_to_{target_col}")
                except (TypeError, ValueError):
                    pass

            if n_rows >= 100 and pd.api.types.is_numeric_dtype(df[column]):
                corr_frame = df[[column, target_col]].dropna()
                if len(corr_frame) > 1:
                    correlation = corr_frame[column].corr(corr_frame[target_col])
                    if correlation is not None and abs(correlation) >= 0.95:
                        reasons.append(f"high_correlation_with_{target_col}:{correlation:.3f}")

        if reasons:
            flagged.append({"column": column, "reasons": sorted(set(reasons))})

    return flagged


class DatasetProfiler:
    """Produce a structured profile report for an arbitrary tabular dataset."""

    def __init__(self, df: pd.DataFrame, source_path: str = "") -> None:
        self.df = df
        self.source_path = source_path

    def run(self) -> DatasetProfile:
        df = self.df
        target_candidates = _infer_target_candidates(df)
        class_distributions = {
            candidate["column"]: _class_distribution(df, candidate["column"])
            for candidate in target_candidates
            if _is_binary_series(df[candidate["column"]])
        }

        duplicate_count = int(df.duplicated().sum())
        notes = [
            "Profiling is heuristic and schema-agnostic; validate findings manually.",
            "Target, timestamp, entity, and leakage candidates are suggestions only.",
        ]

        return DatasetProfile(
            source_path=self.source_path,
            shape={"rows": int(len(df)), "columns": int(df.shape[1])},
            dtypes={column: str(dtype) for column, dtype in df.dtypes.items()},
            missingness={
                column: {
                    "missing_count": int(df[column].isna().sum()),
                    "missing_rate": float(df[column].isna().mean()),
                }
                for column in df.columns
            },
            target_candidates=target_candidates,
            class_distributions=class_distributions,
            categorical_cardinality=_categorical_cardinality(df),
            numerical_summaries=_numerical_summaries(df),
            timestamp_candidates=_timestamp_candidates(df),
            entity_id_candidates=_entity_id_candidates(df),
            duplicate_rows={
                "duplicate_count": duplicate_count,
                "duplicate_rate": float(duplicate_count / len(df)) if len(df) else 0.0,
            },
            potential_leakage_columns=_potential_leakage_columns(df, target_candidates),
            notes=notes,
        )


def profile_dataset(df: pd.DataFrame, source_path: str = "") -> DatasetProfile:
    """Convenience wrapper around ``DatasetProfiler``."""
    return DatasetProfiler(df, source_path=source_path).run()
