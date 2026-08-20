"""Load locally supplied tabular datasets without schema assumptions."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

import pandas as pd


SUPPORTED_SUFFIXES = {
    ".csv",
    ".tsv",
    ".parquet",
    ".pkl",
    ".pickle",
    ".feather",
}


def _read_file(path: Path) -> pd.DataFrame:
    """Read a supported tabular dataset file."""
    suffix = path.suffix.lower()

    if suffix == ".csv":
        return pd.read_csv(path, low_memory=False)

    if suffix == ".tsv":
        return pd.read_csv(path, sep="\t", low_memory=False)

    if suffix == ".parquet":
        return pd.read_parquet(path)

    if suffix in {".pkl", ".pickle"}:
        return pd.read_pickle(path)

    if suffix == ".feather":
        return pd.read_feather(path)

    raise ValueError(
        f"Unsupported file format: {path.suffix}. "
        f"Supported formats: {', '.join(sorted(SUPPORTED_SUFFIXES))}"
    )


def _load_directory(path: Path, pattern: str = "*") -> pd.DataFrame:
    """Load and concatenate supported files from a directory."""
    files = sorted(
        p
        for p in path.glob(pattern)
        if p.is_file() and p.suffix.lower() in SUPPORTED_SUFFIXES
    )

    if not files:
        raise FileNotFoundError(
            f"No supported files found in {path}. "
            f"Supported suffixes: {', '.join(sorted(SUPPORTED_SUFFIXES))}"
        )

    frames = [_read_file(file_path) for file_path in files]

    if len(frames) == 1:
        return frames[0]

    return pd.concat(frames, ignore_index=True)


def load_dataset(
    path: str | Path,
    *,
    join: Literal["none", "inner", "left", "outer"] = "none",
    join_on: str | None = None,
) -> pd.DataFrame:
    """
    Load a tabular dataset from a file or directory.

    Parameters
    ----------
    path:
        Path to a dataset file or directory.

    join:
        How multiple files should be combined:
        - none: concatenate rows
        - inner: inner join
        - left: left join
        - outer: outer join

    join_on:
        Column used when joining multiple files.
    """
    resolved = Path(path).expanduser().resolve()

    if not resolved.exists():
        raise FileNotFoundError(f"Path does not exist: {resolved}")

    if resolved.is_file():
        return _read_file(resolved)

    return _load_directory(resolved) if join == "none" else _merge_directory(
        resolved,
        join=join,
        join_on=join_on,
    )


def _merge_directory(
    path: Path,
    *,
    join: Literal["inner", "left", "outer"],
    join_on: str | None,
) -> pd.DataFrame:
    """Load multiple files from a directory and merge them."""
    files = sorted(
        p
        for p in path.iterdir()
        if p.is_file() and p.suffix.lower() in SUPPORTED_SUFFIXES
    )

    if not files:
        raise FileNotFoundError(
            f"No supported files found in {path}. "
            f"Supported suffixes: {', '.join(sorted(SUPPORTED_SUFFIXES))}"
        )

    if not join_on:
        raise ValueError("`join_on` is required when merging multiple files.")

    frames = [_read_file(file_path) for file_path in files]

    merged = frames[0]

    for frame in frames[1:]:
        if join_on not in merged.columns or join_on not in frame.columns:
            raise KeyError(
                f"Join column '{join_on}' must exist in all datasets."
            )

        merged = merged.merge(frame, on=join_on, how=join)

    return merged