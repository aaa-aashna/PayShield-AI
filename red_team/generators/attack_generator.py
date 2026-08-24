"""
Red Team Attack Generators for PayShield AI.
Implements 6 distinct, parameterized adversarial payment fraud attack strategies:
1. Transaction Burst
2. Amount Escalation
3. Terminal Hopping
4. Behavioral Shift
5. Coordinated Terminal Attack
6. Slow-and-Low Stealth
"""

from __future__ import annotations

import random
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional


@dataclass
class SyntheticTransaction:
    transaction_id: str
    tx_datetime: datetime
    customer_id: str
    terminal_id: str
    tx_amount: float
    attack_type: str
    is_adversarial: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "transaction_id": self.transaction_id,
            "tx_datetime": self.tx_datetime.isoformat(),
            "customer_id": self.customer_id,
            "terminal_id": self.terminal_id,
            "tx_amount": round(self.tx_amount, 2),
            "attack_type": self.attack_type,
            "is_adversarial": self.is_adversarial,
        }


class AttackScenarioGenerator:
    """
    Generates realistic adversarial transaction streams.
    """

    def __init__(self, seed: int = 42) -> None:
        self.rng = random.Random(seed)

    def generate_burst_attack(
        self,
        customer_id: str = "C_1042",
        terminal_id: str = "T_5081",
        start_time: Optional[datetime] = None,
        num_transactions: int = 6,
        intensity: float = 0.8,
    ) -> List[SyntheticTransaction]:
        """
        Attack 1: Transaction Burst - Rapid fire transactions in minutes.
        """
        base_time = start_time or datetime.now()
        txs = []
        # Higher intensity = tighter time spacing (e.g. 15-45 seconds)
        interval_sec = max(10, int(60 * (1.0 - intensity * 0.7)))

        for i in range(num_transactions):
            tx_time = base_time + timedelta(seconds=i * interval_sec + self.rng.randint(2, 8))
            amount = self.rng.uniform(150.0, 450.0) * (1.0 + intensity * 0.5)
            txs.append(
                SyntheticTransaction(
                    transaction_id=f"ATK_BURST_{i+1:03d}",
                    tx_datetime=tx_time,
                    customer_id=str(customer_id),
                    terminal_id=str(terminal_id),
                    tx_amount=amount,
                    attack_type="Transaction Burst",
                )
            )
        return txs

    def generate_amount_escalation_attack(
        self,
        customer_id: str = "C_2109",
        terminal_id: str = "T_3304",
        start_time: Optional[datetime] = None,
        num_transactions: int = 5,
        intensity: float = 0.8,
    ) -> List[SyntheticTransaction]:
        """
        Attack 2: Amount Escalation - Rapidly multiplying transaction values ($50 -> $200 -> $800 -> $3,200).
        """
        base_time = start_time or datetime.now()
        txs = []
        base_amount = 40.0
        multiplier = 2.5 + (intensity * 1.5)

        for i in range(num_transactions):
            tx_time = base_time + timedelta(minutes=i * 4 + self.rng.randint(1, 3))
            amount = base_amount * (multiplier ** i)
            txs.append(
                SyntheticTransaction(
                    transaction_id=f"ATK_ESCALATE_{i+1:03d}",
                    tx_datetime=tx_time,
                    customer_id=str(customer_id),
                    terminal_id=str(terminal_id),
                    tx_amount=amount,
                    attack_type="Amount Escalation",
                )
            )
        return txs

    def generate_terminal_hopping_attack(
        self,
        customer_id: str = "C_3310",
        terminals: Optional[List[str]] = None,
        start_time: Optional[datetime] = None,
        num_transactions: int = 5,
        intensity: float = 0.8,
    ) -> List[SyntheticTransaction]:
        """
        Attack 3: Terminal Hopping - Rapid sequence across geographically/functionally distinct terminals.
        """
        base_time = start_time or datetime.now()
        term_pool = terminals or [f"T_{self.rng.randint(1000, 9999)}" for _ in range(num_transactions)]
        txs = []

        for i in range(num_transactions):
            tx_time = base_time + timedelta(minutes=i * 3 + self.rng.randint(1, 2))
            amount = self.rng.uniform(180.0, 600.0) * (1.0 + intensity * 0.4)
            txs.append(
                SyntheticTransaction(
                    transaction_id=f"ATK_HOP_{i+1:03d}",
                    tx_datetime=tx_time,
                    customer_id=str(customer_id),
                    terminal_id=term_pool[i % len(term_pool)],
                    tx_amount=amount,
                    attack_type="Terminal Hopping",
                )
            )
        return txs

    def generate_behavioral_shift_attack(
        self,
        customer_id: str = "C_4550",
        terminal_id: str = "T_7720",
        start_time: Optional[datetime] = None,
        intensity: float = 0.8,
    ) -> List[SyntheticTransaction]:
        """
        Attack 4: Behavioral Shift - Sudden extreme departure in spend, time of night, and rare terminal.
        """
        base_time = start_time or datetime.now().replace(hour=3, minute=15)  # 3:15 AM
        txs = []
        # Extreme amount (5x to 15x normal)
        amount = 1200.0 * (1.0 + intensity * 2.0)
        txs.append(
            SyntheticTransaction(
                transaction_id="ATK_SHIFT_001",
                tx_datetime=base_time,
                customer_id=str(customer_id),
                terminal_id=str(terminal_id),
                tx_amount=amount,
                attack_type="Behavioral Shift",
            )
        )
        return txs

    def generate_coordinated_attack(
        self,
        terminal_id: str = "T_9100",
        num_bots: int = 5,
        start_time: Optional[datetime] = None,
        intensity: float = 0.8,
    ) -> List[SyntheticTransaction]:
        """
        Attack 5: Coordinated Terminal Attack - Multiple synthetic compromised accounts targeting one terminal in unison.
        """
        base_time = start_time or datetime.now()
        txs = []

        for i in range(num_bots):
            bot_id = f"C_BOT_{self.rng.randint(5000, 9999)}"
            tx_time = base_time + timedelta(seconds=i * 20 + self.rng.randint(5, 15))
            amount = self.rng.uniform(300.0, 900.0) * (1.0 + intensity * 0.5)
            txs.append(
                SyntheticTransaction(
                    transaction_id=f"ATK_COORD_{i+1:03d}",
                    tx_datetime=tx_time,
                    customer_id=bot_id,
                    terminal_id=str(terminal_id),
                    tx_amount=amount,
                    attack_type="Coordinated Attack",
                )
            )
        return txs

    def generate_slow_and_low_attack(
        self,
        customer_id: str = "C_1201",
        terminal_id: str = "T_4402",
        start_time: Optional[datetime] = None,
        num_transactions: int = 4,
        intensity: float = 0.5,
    ) -> List[SyntheticTransaction]:
        """
        Attack 6: Slow-and-Low Stealth - Subtle micro-transactions spaced over longer intervals to evade simple thresholds.
        """
        base_time = start_time or datetime.now()
        txs = []

        for i in range(num_transactions):
            tx_time = base_time + timedelta(hours=i * 12 + self.rng.randint(1, 4))
            amount = self.rng.uniform(18.0, 48.0) * (1.0 + intensity * 0.2)
            txs.append(
                SyntheticTransaction(
                    transaction_id=f"ATK_SLOW_{i+1:03d}",
                    tx_datetime=tx_time,
                    customer_id=str(customer_id),
                    terminal_id=str(terminal_id),
                    tx_amount=amount,
                    attack_type="Slow and Low",
                )
            )
        return txs

    def generate_attack_by_name(
        self,
        attack_type: str,
        customer_id: str = "C_1001",
        terminal_id: str = "T_2002",
        intensity: float = 0.8,
        num_transactions: int = 5,
    ) -> List[SyntheticTransaction]:
        """
        Unified generator dispatcher.
        """
        atk = attack_type.lower().replace("-", "_").replace(" ", "_")

        if "burst" in atk:
            return self.generate_burst_attack(
                customer_id=customer_id,
                terminal_id=terminal_id,
                num_transactions=num_transactions,
                intensity=intensity,
            )
        elif "escalat" in atk:
            return self.generate_amount_escalation_attack(
                customer_id=customer_id,
                terminal_id=terminal_id,
                num_transactions=num_transactions,
                intensity=intensity,
            )
        elif "hop" in atk:
            return self.generate_terminal_hopping_attack(
                customer_id=customer_id,
                num_transactions=num_transactions,
                intensity=intensity,
            )
        elif "shift" in atk:
            return self.generate_behavioral_shift_attack(
                customer_id=customer_id,
                terminal_id=terminal_id,
                intensity=intensity,
            )
        elif "coord" in atk:
            return self.generate_coordinated_attack(
                terminal_id=terminal_id,
                num_bots=num_transactions,
                intensity=intensity,
            )
        elif "slow" in atk:
            return self.generate_slow_and_low_attack(
                customer_id=customer_id,
                terminal_id=terminal_id,
                num_transactions=num_transactions,
                intensity=intensity,
            )
        else:
            return self.generate_burst_attack(
                customer_id=customer_id,
                terminal_id=terminal_id,
                num_transactions=num_transactions,
                intensity=intensity,
            )
