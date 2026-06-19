import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.exc import OperationalError

app = Flask(__name__)
CORS(app)

DB_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:p%40ssw0rd@localhost:5433/token_calc')
app.config['SQLALCHEMY_DATABASE_URI'] = DB_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class Application(db.Model):
    __tablename__ = 'applications'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    services = db.relationship('Service', backref='application', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'services': [s.to_dict() for s in self.services]
        }

class Service(db.Model):
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    app_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    input_words = db.Column(db.Integer, nullable=False)
    output_words = db.Column(db.Integer, nullable=False)
    ratio = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'app_id': self.app_id,
            'name': self.name,
            'input_words': self.input_words,
            'output_words': self.output_words,
            'ratio': self.ratio
        }

class ModelPricing(db.Model):
    __tablename__ = 'model_pricing'
    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(255), nullable=False, unique=True)
    input_price = db.Column(db.Float, nullable=False)
    output_price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'model': self.model_name,
            'input_price': self.input_price,
            'output_price': self.output_price
        }

# Ensure tables exist, fallback to sqlite if postgres fails
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"Postgres failed: {e}. Falling back to SQLite...")
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///token_calc.db'
        db.create_all()

EXCEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tokenEstimator_v2 2 1.xlsx')

@app.route('/api/pricing', methods=['GET'])
def get_pricing():
    try:
        models = ModelPricing.query.all()
        return jsonify({"success": True, "pricing": [m.to_dict() for m in models]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/pricing', methods=['POST'])
def create_pricing():
    data = request.json
    if not data or not data.get('model') or data.get('input_price') is None or data.get('output_price') is None:
        return jsonify({"success": False, "error": "Model name, input_price, and output_price are required"}), 400
        
    # Check if model already exists
    existing = ModelPricing.query.filter_by(model_name=data['model']).first()
    if existing:
        return jsonify({"success": False, "error": "Model already exists"}), 400

    new_model = ModelPricing(
        model_name=data['model'],
        input_price=float(data['input_price']),
        output_price=float(data['output_price'])
    )
    db.session.add(new_model)
    db.session.commit()
    
    return jsonify({"success": True, "model": new_model.to_dict()}), 201

@app.route('/api/pricing/<int:model_id>', methods=['PUT'])
def update_pricing(model_id):
    model = ModelPricing.query.get(model_id)
    if not model:
        return jsonify({"success": False, "error": "Model not found"}), 404
        
    data = request.json
    if 'model' in data:
        # Check uniqueness if name changed
        if data['model'] != model.model_name:
            existing = ModelPricing.query.filter_by(model_name=data['model']).first()
            if existing:
                return jsonify({"success": False, "error": "Model name already exists"}), 400
        model.model_name = data['model']
        
    if 'input_price' in data:
        model.input_price = float(data['input_price'])
    if 'output_price' in data:
        model.output_price = float(data['output_price'])
        
    db.session.commit()
    return jsonify({"success": True, "model": model.to_dict()})

@app.route('/api/pricing/<int:model_id>', methods=['DELETE'])
def delete_pricing(model_id):
    model = ModelPricing.query.get(model_id)
    if not model:
        return jsonify({"success": False, "error": "Model not found"}), 404
        
    db.session.delete(model)
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/applications', methods=['GET'])
def get_applications():
    try:
        apps = Application.query.all()
        return jsonify({"success": True, "applications": [a.to_dict() for a in apps]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/applications', methods=['POST'])
def create_application():
    data = request.json
    if not data or not data.get('name'):
        return jsonify({"success": False, "error": "Name is required"}), 400
    
    new_app = Application(
        name=data['name'],
        description=data.get('description', '')
    )
    db.session.add(new_app)
    db.session.commit()
    
    return jsonify({"success": True, "application": new_app.to_dict()}), 201

@app.route('/api/applications/<int:app_id>/services', methods=['POST'])
def create_service(app_id):
    app_obj = Application.query.get(app_id)
    if not app_obj:
        return jsonify({"success": False, "error": "Application not found"}), 404
        
    data = request.json
    if not data or not data.get('name') or data.get('input_words') is None or data.get('output_words') is None:
        return jsonify({"success": False, "error": "Name, input_words, and output_words are required"}), 400
        
    input_words = float(data['input_words'])
    output_words = float(data['output_words'])
    
    ratio = output_words / input_words if input_words > 0 else 0
    
    new_service = Service(
        app_id=app_id,
        name=data['name'],
        input_words=int(input_words),
        output_words=int(output_words),
        ratio=ratio
    )
    
    db.session.add(new_service)
    db.session.commit()
    
    return jsonify({"success": True, "service": new_service.to_dict()}), 201

@app.route('/api/services/<int:service_id>', methods=['PUT'])
def update_service(service_id):
    service = Service.query.get(service_id)
    if not service:
        return jsonify({"success": False, "error": "Service not found"}), 404
        
    data = request.json
    if 'name' in data:
        service.name = data['name']
    if 'input_words' in data and 'output_words' in data:
        input_words = float(data['input_words'])
        output_words = float(data['output_words'])
        service.input_words = int(input_words)
        service.output_words = int(output_words)
        service.ratio = output_words / input_words if input_words > 0 else 0
        
    db.session.commit()
    return jsonify({"success": True, "service": service.to_dict()})

@app.route('/api/services/<int:service_id>', methods=['DELETE'])
def delete_service(service_id):
    service = Service.query.get(service_id)
    if not service:
        return jsonify({"success": False, "error": "Service not found"}), 404
        
    db.session.delete(service)
    db.session.commit()
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
