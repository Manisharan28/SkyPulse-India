import os
from flask import Flask, jsonify
from flask_cors import CORS
import config  # This loads the .env variables

from database.mongo import init_db
from ingestion.ingestion_worker import start_ingestion
from verification.clustering import start_clustering

def create_app():
    app = Flask(__name__)
    
    # Configure CORS for Vite dev server
    CORS(app, origins=config.CORS_ORIGINS)
    
    # Initialize Database
    with app.app_context():
        init_db()
        
    # Start background threads
    start_ingestion(app)
    start_clustering(app)
    
    # Register blueprints (to be populated in Phase 4)
    from routes.alerts import alerts_bp
    app.register_blueprint(alerts_bp, url_prefix="/api")
    
    @app.route("/api/health")
    def health_check():
        return jsonify({"status": "ok", "message": "SIH API is running"})
        
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host=config.FLASK_HOST, port=config.FLASK_PORT, debug=True, use_reloader=False)
    # use_reloader=False is important here so the background thread doesn't start twice
