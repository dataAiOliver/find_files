from common.mongodb import *
from common.files import *

drop_collection = True
collection = get_mongo_collection(
    "filter_perfomance_test", drop_collection=drop_collection
)

# new mock data
if drop_collection:
    insert_into_mongo(collection, 100)
