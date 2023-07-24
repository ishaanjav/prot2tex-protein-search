# app.py
from flask_cors import CORS
from flask import Flask, request, jsonify
from protex import run_query_esm, run_query_text
import os
app = Flask(__name__)


CORS(app)


@app.route('/run_protex_text', methods=['GET', 'POST'])
def run_protex_text():
    print("HERE")
    # get arguments if any from request
    # Check if 'text_query' is in the request body
    if 'text_query' in request.json:
        text_query = request.json['text_query']
        result = run_query_text(text_query, 10, 'interpro_data.csv')
        return jsonify(result)
    else:
        return jsonify({'error': 'No text_query found in the request body.'})


@app.route('/run_protex_esm', methods=['GET', 'POST'])
def run_protex_esm():
    # get arguments if any from request
    # Check if 'text_query' is in the request body
    if 'text_query' in request.json:
        text_query = request.json['text_query']
        result = run_query_esm(text_query, 10, 'fully_embedded_data.pkl')
        return jsonify(result)
    else:
        return jsonify({'error': 'No text_query found in the request body.'})


if __name__ == '__main__':
    app.run()
