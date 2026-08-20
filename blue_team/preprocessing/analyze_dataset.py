"""CLI entry point for schema-agnostic dataset profiling."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from blue_team.preprocessing.loader import load_dataset
from blue_team.preprocessing.profiler import DatasetProfiler


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Profile a locally supplied tabular dataset without hardcoded schema "
            "assumptions. Intended for research and baseline dataset inspection."
        )
    )
    parser.add_argument(
        "--path",
        required=True,
        help="Path to a dataset file or directory containing tabular files.",
    )
    parser.add_argument(
        "--join",
        choices=["none", "inner", "left", "outer"],
        default="none",
        help="When loading multiple files from a directory, merge mode (default: none).",
    )
    parser.add_argument(
        "--join-on",
        default=None,
        help="Column name used to merge multiple files.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional path to write the JSON profile report.",
    )
    parser.add_argument(
        "--sample-rows",
        type=int,
        default=None,
        help="Optionally profile only the first N rows (useful for large files).",
    )
    return parser


def _print_summary(report: dict) -> None:
    print("=== Dataset Profile ===")
    print(f"Source: {report['source_path']}")
    print(f"Shape: {report['shape']['rows']:,} rows x {report['shape']['columns']} columns")
    print(f"Duplicate rows: {report['duplicate_rows']['duplicate_count']:,} "
          f"({report['duplicate_rows']['duplicate_rate']:.4%})")

    print("\n--- Column types ---")
    for column, dtype in report["dtypes"].items():
        missing_rate = report["missingness"][column]["missing_rate"]
        print(f"  {column}: {dtype} (missing {missing_rate:.2%})")

    if report["target_candidates"]:
        print("\n--- Target candidates ---")
        for candidate in report["target_candidates"]:
            print(f"  {candidate['column']}: {', '.join(candidate['reasons'])}")

    if report["class_distributions"]:
        print("\n--- Class distributions ---")
        for column, stats in report["class_distributions"].items():
            print(f"  {column}:")
            for label, values in stats["distribution"].items():
                print(f"    {label}: {values['count']:,} ({values['rate']:.4%})")

    if report["timestamp_candidates"]:
        print("\n--- Timestamp candidates ---")
        for candidate in report["timestamp_candidates"]:
            print(f"  {candidate['column']}: {', '.join(candidate['reasons'])}")

    if report["entity_id_candidates"][:10]:
        print("\n--- Entity ID candidates (top 10) ---")
        for candidate in report["entity_id_candidates"][:10]:
            print(
                f"  {candidate['column']}: {candidate['unique_values']:,} unique "
                f"({', '.join(candidate['reasons'])})"
            )

    if report["potential_leakage_columns"]:
        print("\n--- Potential leakage columns ---")
        for item in report["potential_leakage_columns"]:
            print(f"  {item['column']}: {', '.join(item['reasons'])}")

    print("\n--- Notes ---")
    for note in report["notes"]:
        print(f"  - {note}")


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    df = load_dataset(args.path, join=args.join, join_on=args.join_on)
    if args.sample_rows is not None:
        df = df.head(args.sample_rows)

    profile = DatasetProfiler(df, source_path=str(Path(args.path).resolve())).run()
    report = profile.to_dict()
    _print_summary(report)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"\nWrote profile report to {output_path}")


if __name__ == "__main__":
    main()
