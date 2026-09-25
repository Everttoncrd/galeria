from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from pathlib import Path
import requests
import os


# =========================================================
# CONFIGURAÇÃO
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(
    dotenv_path=ENV_FILE,
    override=True
)

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
PEXELS_API_URL = "https://api.pexels.com/v1/search"

app = Flask(__name__)


# =========================================================
# RATE LIMIT
# =========================================================

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[]
)


# =========================================================
# CORS
# =========================================================

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://127.0.0.1:5500",
                "http://localhost:5500"
            ]
        }
    }
)


# =========================================================
# HOME / STATUS DA API
# =========================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "application": "Viageiro's Tales API",
        "status": "online"
    }), 200


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "service": "gallery-api"
    }), 200


# =========================================================
# PESQUISA DE IMAGENS
# =========================================================

@app.route("/api/images", methods=["GET"])
@limiter.limit("30 per minute")
def search_images():

    # -------------------------
    # Query
    # -------------------------

    query = request.args.get(
        "query",
        "travel"
    ).strip()

    if not query:

        return jsonify({
            "error": "Informe um termo para pesquisa."
        }), 400

    if len(query) > 100:

        return jsonify({
            "error": "O termo pesquisado é muito longo."
        }), 400


    # -------------------------
    # Paginação
    # -------------------------

    try:

        page = int(
            request.args.get(
                "page",
                1
            )
        )

        per_page = int(
            request.args.get(
                "per_page",
                20
            )
        )

    except ValueError:

        return jsonify({
            "error": "Parâmetros de paginação inválidos."
        }), 400


    if page < 1:

        return jsonify({
            "error": "A página deve ser maior que zero."
        }), 400


    # Limite máximo de imagens por requisição
    per_page = max(
        1,
        min(per_page, 40)
    )


    # -------------------------
    # Verificação da API Key
    # -------------------------

    if not PEXELS_API_KEY:

        return jsonify({
            "error": "Serviço de imagens indisponível."
        }), 500


    # -------------------------
    # Comunicação com Pexels
    # -------------------------

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


        # Credencial inválida
        if response.status_code == 401:

            return jsonify({
                "error": "Serviço de imagens indisponível."
            }), 502


        # Limite da API externa
        if response.status_code == 429:

            return jsonify({
                "error": "Limite temporário de pesquisas atingido."
            }), 429


        response.raise_for_status()

        data = response.json()


        # -------------------------
        # Resposta controlada
        # -------------------------

        photos = []

        for photo in data.get("photos", []):

            src = photo.get("src", {})

            photos.append({
                "id": photo.get("id"),

                "width": photo.get("width"),
                "height": photo.get("height"),

                "url": photo.get("url"),

                "photographer": photo.get(
                    "photographer"
                ),

                "photographer_url": photo.get(
                    "photographer_url"
                ),

                "alt": photo.get(
                    "alt",
                    ""
                ),

                "src": {
                    "medium": src.get("medium"),
                    "large": src.get("large"),
                    "large2x": src.get("large2x")
                }
            })


        return jsonify({
            "page": data.get(
                "page",
                page
            ),

            "per_page": data.get(
                "per_page",
                per_page
            ),

            "total_results": data.get(
                "total_results",
                0
            ),

            "next_page": bool(
                data.get("next_page")
            ),

            "photos": photos
        }), 200


    # -------------------------
    # Timeout
    # -------------------------

    except requests.Timeout:

        return jsonify({
            "error": "O serviço de imagens demorou para responder."
        }), 504


    # -------------------------
    # Erro de comunicação
    # -------------------------

    except requests.RequestException as error:

        print(
            f"Erro ao consultar Pexels: {error}"
        )

        return jsonify({
            "error": "Não foi possível consultar o serviço de imagens."
        }), 502


    # -------------------------
    # JSON inesperado
    # -------------------------

    except ValueError:

        return jsonify({
            "error": "Resposta inválida do serviço de imagens."
        }), 502


# =========================================================
# ERRO 404
# =========================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "error": "Endpoint não encontrado."
    }), 404


# =========================================================
# RATE LIMIT - ERRO 429
# =========================================================

@app.errorhandler(429)
def rate_limit_exceeded(error):

    return jsonify({
        "error": (
            "Muitas pesquisas em pouco tempo. "
            "Aguarde alguns instantes e tente novamente."
        )
    }), 429


# =========================================================
# ERRO 500
# =========================================================

@app.errorhandler(500)
def internal_error(error):

    return jsonify({
        "error": "Erro interno do servidor."
    }), 500


# =========================================================
# DESENVOLVIMENTO LOCAL
# =========================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )