import sys
import hashlib  # untuk hash
import json

from time import time
from uuid import uuid4  # address blockchain

from flask import Flask
from flask.globals import request
from flask.json import jsonify

import requests
from urllib.parse import urlparse


class Blockchain(object):
    difficulty_target = (
        "0000"  # kalau hash-nya udh ketemu 4 digit 0 di depan maka nonce ketemu
    )

    def hash_block(self, block):
        block_encoded = json.dumps(
            block, sort_keys=True
        ).encode()  # sort keys urutkan key secara berurutan
        return hashlib.sha256(block_encoded).hexdigest()  # hexdigest buat jadiin str

    def __init__(self):
        self.nodes = set()
        self.chain = []  # simpan semua data di chain/rantai
        self.current_trx = []
        genesis_hash = self.hash_block("genesis_block")

        self.append_block(
            hash_of_prev_block=genesis_hash,
            nonce=self.proof_of_work(0, genesis_hash, []),
        )

    def add_node(self, address):
        parse_url = urlparse(address)
        self.nodes.add(parse_url.netloc)
        print(parse_url.netloc)

    def valid_chain(self, chain):
        last_block = chain[0]
        current_idx = 1

        while current_idx < len(chain):
            block = chain[current_idx]

            if block["hash_of_prev_block"] != self.hash_block(last_block):
                return False

            if not self.valid_proof(
                current_idx,
                block["hash_of_prev_block"],
                block["transactions"],
                block["nonce"],
            ):
                return False

            last_block = block
            current_idx += 1

        return True

    def update_blockchain(self):
        neighbors = self.nodes
        new_chain = None

        max_length = len(self.chain)

        for node in neighbors:
            response = requests.get(f"http://{node}/blockchain")

            if response.status_code == 200:
                length = response.json()["length"]
                chain = response.json()["chain"]

                if length > max_length and self.valid_chain(chain):
                    max_length = length
                    new_chain = chain

                if new_chain:
                    self.chain = new_chain
                    return True

        return False

    def proof_of_work(self, index, hash_of_prev_block, trx):
        nonce = 0

        while self.valid_proof(index, hash_of_prev_block, trx, nonce) is False:
            nonce += 1

        return nonce

    def valid_proof(self, index, hash_of_prev_block, trx, nonce):
        content = f"{index}{hash_of_prev_block}{trx}{nonce}".encode()

        content_hash = hashlib.sha256(content).hexdigest()
        return content_hash[: len(self.difficulty_target)] == self.difficulty_target

    def append_block(self, nonce, hash_of_prev_block):
        block = {
            "index": len(self.chain),
            "timestamp": time(),
            "transactions": self.current_trx,
            "nonce": nonce,
            "hash_of_prev_block": hash_of_prev_block,
        }

        self.current_trx = []
        self.chain.append(block)
        return block

    def add_trx(self, sender, recipient, ammount):
        self.current_trx.append(
            {
                "ammount": ammount,
                "recipient": recipient,
                "sender": sender,
            }
        )
        return self.last_block["index"] + 1

    @property
    def last_block(self):
        return self.chain[-1]


app = Flask(__name__)

node_identifier = str(uuid4()).replace("-", "")

blockchain = Blockchain()


# routes
@app.route("/blockchain", methods=["GET"])
def full_chain():
    response = {
        "chain": blockchain.chain,
        "length": len(blockchain.chain),
    }

    return jsonify(response), 200


@app.route("/mine", methods=["GET"])
def mine_block():
    blockchain.add_trx(sender="0", recipient=node_identifier, ammount=1)

    last_block_hash = blockchain.hash_block(blockchain.last_block)

    index = len(blockchain.chain)

    nonce = blockchain.proof_of_work(index, last_block_hash, blockchain.current_trx)

    block = blockchain.append_block(nonce, last_block_hash)

    response = {
        "message": "Block baru telah ditambahkan",
        "index": block["index"],
        "hash_of_prev_block": block["hash_of_prev_block"],
        "nonce": block["nonce"],
        "transcations": block["transactions"],
    }

    return jsonify(response), 200


@app.route("/transactions/new", methods=["POST"])
def new_trx():
    values = request.get_json()

    required_fields = ["sender", "recipient", "ammount"]
    if not all(k in values for k in required_fields):
        return "Missing fields"

    index = blockchain.add_trx(
        values["sender"],
        values["recipient"],
        values["ammount"],
    )

    response = {"message": f"Transaksi akan ditambahkan ke blok {index}"}
    return jsonify(response), 201


@app.route("/nodes/add_nodes", methods=["POST"])
def add_nodes():
    values = request.get_json()
    nodes = values.get("nodes")

    if nodes is None:
        return "Error, missing node(s) info", 400

    for node in nodes:
        blockchain.add_node(node)

    response = {
        "message": "Node baru telah ditambahkan",
        "nodes": list(blockchain.nodes),
    }

    return jsonify(response), 201


@app.route("/nodes/sync", methods=["GET"])
def sync():
    updated = blockchain.update_blockchain()
    if updated:
        response = {
            "message": "Blockchain telah diuupdate dengan data terbaru",
            "nodes": blockchain.chain,
        }
    else:
        response = {
            "message": "Blockchain sudah menggunakan data terbaru",
            "nodes": blockchain.chain,
        }

    return jsonify(response), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(sys.argv[1]))
