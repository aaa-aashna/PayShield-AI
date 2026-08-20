"""Load locally supplied tabular datasets without schema assumptions."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

import pandas as pd

SUPPORTED_SUFFIXES = {".csv", ".tsv", ".pkl", ".pickle"}


def _read_file(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path, low_memory=False)
    if suffix == ".tsv":
        return pd.read_csv(path, sep="\t", low_memory=False)
    if suffix in {".pkl", ".pickle"}:
        return pd.read_pickle(path)
    raise ValueError(f"Unsupported file format: {path.suffix}")


def _load_directory(path: Path, pattern: str = "*") -> pd.DataFrame:
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
    Load a tabular dataset from a file or directory of files.

    Parameters
    ----------
    path:
        Path to a single file or a directory containing one or more tabular files.
    join:
        How to combine multiple files in a directory. ``none`` concatenates rows;
        other modes merge on ``join_on``.
    join_on:
        Column name used when merging multiple files. Required unless ``join`` is
        ``none`` and files are row-concatenated.
    """
    resolved = Path(path).expanduser().resolve()
    if not resolved.exists():
        raise FileNotFoundError(f"Path does not exist: {resolved}")

    if resolved.is_file():
        return _read_file(resolved)

    files = sorted(
        p
        for p in resolved.iterdir()
        if p.is_file() and p.suffix.lower() in SUPPORTED_SUFFIXES
    )
    if not files:
        raise FileNotFoundError(
            f"No supported files found in {resolved}. "
            f"Supported suffixes: {', '.join(sorted(SUPPORTED_SUFFIXES))}"
        )

    if len(files) == 1:
        return _read_file(files[0])

    frames = [_read_file(file_path) for file_path in files]
    if join == "none":
        return pd.concat(frames, ignore_index=True)

    if not join_on:
        raise ValueError("`join_on` is required when merging multiple files.")

    merged = frames[0]
    for frame in frames[1:]:
        merged = merged.merge(frame, on=join_on, how=join)
    return merged
