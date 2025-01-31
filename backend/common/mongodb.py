from pymongo import MongoClient
from common.config import *
import uuid, random, datetime
from faker import Faker
from dotenv import load_dotenv

_ = load_dotenv("config.env")

############################################################
# DB: MONGO
############################################################

host = os.getenv("MONGODB_HOST")
port = int(os.getenv("MONGODB_PORT"))
username = os.getenv("MONGODB_USERNAME")
password = os.getenv("MONGODB_PASSWORD")
database_name = os.getenv("MONGODB_DB_NAME")
logger.info(f"host: {host}")
print(f"host: {host}")


client_mongo = MongoClient(host=host, port=port, username=username, password=password)


def get_mongo_collection(collection_name_mongo, drop_collection=False):
    db = client_mongo[database_name]
    collection_mongo = db[collection_name_mongo]
    if drop_collection:
        collection_mongo.drop()

    return collection_mongo


############################################################
# DB: MOCKDATA
############################################################


def generate_mongo_documents(n):
    fake = Faker()

    # Pre-generate a pool of values to select from
    file_ids = [random.randint(1000, 9999) for _ in range(100)]
    rechnungsnummern = [f"rechnung {uuid.uuid4()}" for _ in range(100)]
    rechnungsdaten = [
        fake.date_time_between(start_date="-1y", end_date="now") for _ in range(50)
    ]
    hauptkategorien = [fake.word() for _ in range(30)]
    unterkategorien = [fake.word() for _ in range(30)]
    kaeufer = [(fake.first_name(), fake.last_name(), fake.company()) for _ in range(50)]
    verkaeufer = [
        (fake.first_name(), fake.last_name(), fake.company()) for _ in range(50)
    ]
    preise = [round(random.uniform(10, 1000), 2) for _ in range(100)]

    for _ in range(n):
        file_id = random.choice(file_ids)
        rechnungsnummer = random.choice(rechnungsnummern)
        rechnungsdatum = random.choice(rechnungsdaten)
        hauptkategorie = random.choice(hauptkategorien)
        unterkategorie = random.choice(unterkategorien)
        kaeufer_vorname, kaeufer_nachname, kaeufer_firma = random.choice(kaeufer)
        verkaeufer_vorname, verkaeufer_nachname, verkaeufer_firma = random.choice(
            verkaeufer
        )
        preis = random.choice(preise)

        # Generate a random path structure
        filename = f"File_{file_id}.docx"

        ebene0 = f"fp0_{random.randint(1, 3)}"
        ebene1 = f"fp1_{random.randint(1, 5)}"
        ebene2 = f"fp2_{random.randint(1, 7)}"
        filepath = f"{ebene0}/{ebene1}/{ebene2}/{filename}"

        ebene0 = f"fp_c0_{random.randint(1, 3)}"
        ebene1 = f"fp_c1_{random.randint(1, 5)}"
        ebene2 = f"fp_c2_{random.randint(1, 7)}"
        filepath_custom = f"{ebene0}/{ebene1}/{ebene2}/{filename}"

        yield {
            "_id": str(uuid.uuid4()),
            "filepath": filepath,
            "filepath_custom": filepath_custom,
            "category": "Rechnung",
            "src": {
                "type": "local",
                "fp": os.getenv("DUMMY_FILE"),
            },
            "metadata": {
                "infos": {
                    "receiptid": rechnungsnummer,
                    "receiptdate": rechnungsdatum,
                },
                "category": {
                    "maincategory": hauptkategorie,
                    "subcategory": unterkategorie,
                },
                "buyer": {
                    "firstname": kaeufer_vorname,
                    "lastname": kaeufer_nachname,
                    "company": kaeufer_firma,
                },
                "kseller": {
                    "firstname": verkaeufer_vorname,
                    "lastname": verkaeufer_nachname,
                    "company": verkaeufer_firma,
                },
                "price": {"price": preis},
            },
            "summary": "Small summary of the file ... .",
        }


def insert_into_mongo(collection, n, batch_size=1000):
    buffer = []  # Temporary list to store batch of documents

    for doc in generate_mongo_documents(n):
        buffer.append(doc)

        # Insert in batches
        if len(buffer) >= batch_size:
            collection.insert_many(buffer)
            buffer.clear()  # Clear the buffer after insertion

    # Insert any remaining documents
    if buffer:
        collection.insert_many(buffer)

    print(f"Inserted {n} documents into MongoDB.")


def get_paths_with_types(d, path=None):
    if path is None:
        path = []

    paths = []

    if isinstance(d, dict):
        for key, value in d.items():
            new_path = path + [key]
            if isinstance(value, dict):
                paths.extend(get_paths_with_types(value, new_path))
            else:
                paths.append((new_path, type(value).__name__))
    else:
        paths.append((path, type(d).__name__))

    return paths


def get_map_path2type(collection):

    results = list(collection.find({}))

    r = get_paths_with_types(results[0])

    map_filters = {}
    for e in r:
        map_filters[".".join(e[0])] = e[1]

    return map_filters


# calculate config file path2type.json
def calculate_config_file_path2type(collection):
    path2type = get_map_path2type(collection)

    return {k: v for k, v in path2type.items() if not k in ["_id", "filepath_custom"]}


def get_filter2query(j_filter, path2type):

    query = {}
    for k, v in j_filter.items():
        # we currently mock this. Need to fix later
        if k == "text":
            k = "metadata.infos.rechnungsnummer"
        if k == "datum":
            k = "metadata.infos.rechnungsdatum"
        if path2type[k] == "str":
            if (v.startswith("*")) and (v.endswith("*")):
                v_query = {"$regex": v.replace("*", ""), "$options": "i"}
            elif v.startswith("*"):
                v_query = {"$regex": "^" + v.replace("*", ""), "$options": "i"}
            elif v.endswith("*"):
                v_query = {"$regex": v.replace("*", "") + "$", "$options": "i"}
            else:
                v_query = v
        elif path2type[k] == "datetime":
            v_date = datetime.datetime.strptime(
                v.replace("<", "").replace(">", "").replace("=", ""), "%d.%m.%Y"
            )
            if v.startswith(">="):
                v_query = {"$gte": v_date}
            elif v.startswith("<="):
                v_query = {"$lte": v_date}
            elif v.startswith("<"):
                v_query = {"$lt": v_date}
            elif v.startswith(">"):
                v_query = {"$gt": v_date}
        elif path2type[k] in ["float", "int"]:
            v_numeric = float(v.replace("<", "").replace(">", "").replace("=", ""))
            if v.startswith(">="):
                v_query = {"$gte": v_numeric}
            elif v.startswith("<="):
                v_query = {"$lte": v_numeric}
            elif v.startswith("<"):
                v_query = {"$lt": v_numeric}
            elif v.startswith(">"):
                v_query = {"$gt": v_numeric}
        else:
            logger.error(f"UNKNOWN v_numeric")
        query[k] = v_query

    return query
