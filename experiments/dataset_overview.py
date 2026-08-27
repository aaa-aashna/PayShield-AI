from pathlib import Path

import pandas as pd


DATA_DIR = Path("data/raw/fraud_handbook_raw/data")


files = sorted(DATA_DIR.glob("*.pkl"))

total_rows = 0
total_fraud = 0

first_timestamp = None
last_timestamp = None

customers = set()
terminals = set()

for file_path in files:
    df = pd.read_pickle(file_path)

    total_rows += len(df)
    total_fraud += int(df["TX_FRAUD"].sum())

    file_first = df["TX_DATETIME"].min()
    file_last = df["TX_DATETIME"].max()

    if first_timestamp is None or file_first < first_timestamp:
        first_timestamp = file_first

    if last_timestamp is None or file_last > last_timestamp:
        last_timestamp = file_last

    customers.update(df["CUSTOMER_ID"].astype(str).unique())
    terminals.update(df["TERMINAL_ID"].astype(str).unique())


print("Files:", len(files))
print("Rows:", f"{total_rows:,}")
print("Fraud:", f"{total_fraud:,}")
print("Fraud rate:", f"{total_fraud / total_rows:.4%}")
print("First transaction:", first_timestamp)
print("Last transaction:", last_timestamp)
print("Unique customers:", f"{len(customers):,}")
print("Unique terminals:", f"{len(terminals):,}")