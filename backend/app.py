from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import os


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

load_dotenv(
    os.path.join(BASE_DIR, ".env")
)


app = Flask(__name__)
CORS(app)


PEXELS_API_KEY = os.getenv(
    "PEXELS_API_KEY"
)

PEXELS_API_URL = (
    "https://api.pexels.com/v1/search"
)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Viageiro's Tales API",
        "status": "online"
    })


@app.route("/api/images", methods=["GET"])
def search_images():

    query = request.args.get("query", "travel").strip()

    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
    except ValueError:
        return jsonify({
            "error": "Parâmetros de paginação inválidos."
        }), 400

    if not query:
        return jsonify({
            "error": "Informe um termo para pesquisa."
        }), 400

    if page < 1:
        page = 1

    # Evita que alguém use nosso endpoint para solicitar
    # uma quantidade exagerada de resultados.
    per_page = max(1, min(per_page, 40))

    if not PEXELS_API_KEY:
        return jsonify({
            "error": "PEXELS_API_KEY não configurada."
        }), 500

    try:

        response = requests.get(
            PEXELS_API_URL,
            headers={
                "Authorization": PEXELS_API_KEY
            },
            params={
                "query": query,
                "page": page,
                "per_page": per_page
            },
            timeout=10
        )

        if response.status_code == 401:
            return jsonify({
                "error": "Falha na autenticação com o serviço de imagens."
            }), 502

        if response.status_code == 429:
            return jsonify({
                "error": "Limite da API de imagens atingido."
            }), 429

        response.raise_for_status()

        data = response.json()

        return jsonify(data)

    except requests.Timeout:

        return jsonify({
            "error": "O serviço de imagens demorou demais para responder."
        }), 504

    except requests.RequestException as error:

        print(f"Erro Pexels: {error}")

        return jsonify({
            "error": "Não foi possível consultar o serviço de imagens."
        }), 502


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )