from flask import Flask, request, jsonify
import psycopg2

app = Flask(__name__)

# Conexión a PostgreSQL
conn = psycopg2.connect(
    host="localhost",
    database="nombre_basedatos",
    user="usuario",
    password="contraseña"
)
cursor = conn.cursor()

# Ruta para guardar un nuevo proyecto
@app.route('/api/proyectos', methods=['POST'])
def crear_proyecto():
    data = request.get_json()
    cursor.execute("""
        INSERT INTO proyecto (ot_aire, ot_prst, nombre_proyecto, departamento, municipio, barrio, fecha_inicio, estado_inicial, cancelado, incluir_en_contrato, negado, estado_actual, estado_asignacion)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        data['ot_aire'], data['ot_prst'], data['nombre_proyecto'], data['departamento'], data['municipio'],
        data['barrio'], data['fecha_inicio'], data['estado_inicial'], data['cancelado'], data['incluir_en_contrato'],
        data['negado'], data['estado_actual'], data['estado_asignacion']
    ))
    conn.commit()
    return jsonify({"mensaje": "Proyecto guardado correctamente"}), 201

# Ruta para extraer coordenadas de archivo KMZ
@app.route('/api/kmz', methods=['POST'])
def leer_kmz():
    file = request.files['kmz']
    # Aquí iría el código para descomprimir y extraer coordenadas del KMZ
    # Por ejemplo, usar fastkml o simplekml
    return jsonify({"coordenadas": []})

if __name__ == '__main__':
    app.run(debug=True)
