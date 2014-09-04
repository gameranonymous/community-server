from recsys.datamodel.data import Data
from recsys.datamodel.factorize import SVD
import cPickle

import db

if __name__ == "__main__":
    conn = db.database_connection()
    cur = conn.cursor()

    cur.execute("select * from svd_entries")
    data = Data()

    track_path_lookup = []
    track_path_entries = set()

    for idx,(user_id, track_path, count) in enumerate(cur):
        if idx % 1024 == 0:
            print idx
        data.add_tuple((count, track_path, user_id))

    svd = SVD()
    svd.set_data(data_model)
    svd.compute(k=100, min_values=3, mean_center=True)
                                                                                        savefile = None)
    with open("the_svd.svd", "w") as fp:
        cPickle.dump(svd, fp)
