from blue_team.preprocessing.dataset_builder import (
    chronological_split,
    load_transaction_files,
)


DATA_DIR = "data/raw/fraud_handbook_raw/data"


df = load_transaction_files(DATA_DIR)

train, validation, test = chronological_split(df)

print("Total:", len(df))
print("Train:", len(train))
print("Validation:", len(validation))
print("Test:", len(test))

print()
print("TRAIN")
print(train["TX_DATETIME"].min())
print(train["TX_DATETIME"].max())

print()
print("VALIDATION")
print(validation["TX_DATETIME"].min())
print(validation["TX_DATETIME"].max())

print()
print("TEST")
print(test["TX_DATETIME"].min())
print(test["TX_DATETIME"].max())

print()
print("Fraud counts")
print("Train:", int(train["TX_FRAUD"].sum()))
print("Validation:", int(validation["TX_FRAUD"].sum()))
print("Test:", int(test["TX_FRAUD"].sum()))