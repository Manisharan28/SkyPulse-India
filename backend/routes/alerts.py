from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime, UTC
from database.mongo import get_collection

alerts_bp = Blueprint('alerts', __name__)

def serialize_doc(doc):
    """Helper to serialize MongoDB document to JSON."""
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    if "timestamp" in doc and isinstance(doc["timestamp"], datetime):
        doc["timestamp"] = doc["timestamp"].isoformat()
    if "created_at" in doc and isinstance(doc["created_at"], datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc

@alerts_bp.route("/alerts", methods=["GET"])
def get_alerts():
    collection = get_collection()
    query = {}
    
    # Filters
    status = request.args.get("status")
    if status:
        query["status"] = status
        
    event_type = request.args.get("event_type")
    if event_type:
        query["event_type"] = event_type
        
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    
    if start_date or end_date:
        query["timestamp"] = {}
        if start_date:
            try:
                query["timestamp"]["$gte"] = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            except ValueError:
                pass
        if end_date:
            try:
                query["timestamp"]["$lte"] = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            except ValueError:
                pass
                
    # Sort and limit
    cursor = collection.find(query).sort("created_at", -1).limit(200)
    alerts = [serialize_doc(doc) for doc in cursor]
    
    return jsonify(alerts)

@alerts_bp.route("/alerts/<alert_id>", methods=["GET"])
def get_alert(alert_id):
    collection = get_collection()
    try:
        doc = collection.find_one({"_id": ObjectId(alert_id)})
        if doc:
            return jsonify(serialize_doc(doc))
        else:
            return jsonify({"error": "Alert not found"}), 404
    except Exception as e:
        return jsonify({"error": "Invalid ID format"}), 400

@alerts_bp.route("/stats", methods=["GET"])
def get_stats():
    collection = get_collection()
    
    # Aggregation pipeline for counts
    pipeline = [
        {
            "$group": {
                "_id": None,
                "total": {"$sum": 1},
                "verified": {"$sum": {"$cond": [{"$eq": ["$status", "Verified"]}, 1, 0]}},
                "emerging": {"$sum": {"$cond": [{"$eq": ["$status", "Emerging"]}, 1, 0]}},
                "flagged": {"$sum": {"$cond": [{"$eq": ["$status", "Flagged"]}, 1, 0]}}
            }
        }
    ]
    
    stats_result = list(collection.aggregate(pipeline))
    if not stats_result:
        base_stats = {"total": 0, "verified": 0, "emerging": 0, "flagged": 0}
    else:
        res = stats_result[0]
        base_stats = {
            "total": res.get("total", 0),
            "verified": res.get("verified", 0),
            "emerging": res.get("emerging", 0),
            "flagged": res.get("flagged", 0)
        }
        
    # By event type
    event_pipeline = [
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}}
    ]
    event_results = list(collection.aggregate(event_pipeline))
    by_event_type = {item["_id"]: item["count"] for item in event_results if item["_id"]}
    base_stats["by_event_type"] = by_event_type
    
    return jsonify(base_stats)

@alerts_bp.route("/clusters", methods=["GET"])
def get_clusters():
    collection = get_collection()
    
    # Get all distinct cluster IDs that are not None
    # Then for each, get the center (average of coordinates) and count
    pipeline = [
        {"$match": {"cluster_id": {"$ne": None}, "location": {"$ne": None}}},
        {"$group": {
            "_id": "$cluster_id",
            "count": {"$sum": 1},
            "avg_lng": {"$avg": {"$arrayElemAt": ["$location.coordinates", 0]}},
            "avg_lat": {"$avg": {"$arrayElemAt": ["$location.coordinates", 1]}},
            "alert_ids": {"$push": "$_id"}
        }}
    ]
    
    results = list(collection.aggregate(pipeline))
    clusters = []
    for r in results:
        clusters.append({
            "cluster_id": r["_id"],
            "count": r["count"],
            "center": [r["avg_lat"], r["avg_lng"]], # Send as [lat, lng] for Leaflet
            "alert_ids": [str(aid) for aid in r["alert_ids"]]
        })
        
    return jsonify(clusters)
