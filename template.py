import datetime
import hashlib
import json


class Transaction:
    def __init__(self, sender, receiver, amount):
        # atribut
        self.sender = sender
        self.receiver = receiver
        self.amount = amount

    def to_dict(self):
        return {"sender": self.sender, "receiver": self.receiver, "amount": self.amount}

    def print(self):
        print(self.to_dict())


class Block:
    def __init__(self, index, transactions, previous_hash):
        self.index = index
        self.timestamp = str(datetime.datetime.now())
        self.transactions = transactions
        self.nonce = 0
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        print(self.transactions)
        print(type(self.transactions))
        print([t.to_dict() for t in self.transactions])
        print(type([t.to_dict() for t in self.transactions]))

        block = {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": [t.to_dict() for t in self.transactions],
            "nonce": self.nonce,
            "previous_hash": self.previous_hash,
        }
        block_string = json.dumps(block)
        generated_hash = hashlib.sha256(block_string.encode()).hexdigest()
        return generated_hash

    def mine_block(self, difficulty):
        while self.hash[:difficulty] != "0" * difficulty:
            self.nonce += 1
            self.hash = self.calculate_hash()
        print("Block Mined: ", self.hash, self.nonce)

    def print_hash(self):
        print(self.calculate_hash)


class Blockchain:
    def __init__(self):
        self.chain = [self.init_genesis_block()]
        self.difficulty = 3
        self.pending_transactions = []

    def init_genesis_block(self):
        return Block(0, [], "0")

    def add_transactions(self, transactions):
        self.pending_transactions.append(transactions)

    def get_latest_chain(self):
        return self.chain[-1]

    def mine_pending_transactions(self):
        index = len(self.chain)
        previous_hash = self.get_latest_chain().hash
        block_new = Block(index, self.pending_transactions, previous_hash)
        block_new.mine_block(self.difficulty)
        self.pending_transactions = []

    def is_valid(self):
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            prev = self.chain[i - 1]

            if current.hash != prev.hash:
                return False

            if current.hash != current.caculate_hash():
                return False

        return True


if __name__ == "__main__":
    trans = Transaction("Alice", "Bob", 10)
    trans.print()

    block = Block("1", [trans], 0)
    block.print_hash()

    myBlockchain = Blockchain()
    myBlockchain.add_transactions(trans)

    myBlockchain.mine_pending_transactions()

    print("Apakah valid? ")
    print(myBlockchain.is_valid())
