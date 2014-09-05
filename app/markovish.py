#!/usr/bin/env python
# encoding: utf-8
"""
markovish.py

Created by Ben Fields on 2014-09-05..
"""

import sys
import os
import unittest
import numpy as np
from scipy import stats
from db import database_connection
from recsys.datamodel.data import Data
from recsys.algorithm.factorize import SVD


class markovish:
    def __init__(self, user = None, connection=database_connection(), svd=None):
        self.conn = connection
        self.user = user
        self.svd = svd
        
    def get_label(self, track_id, conn=None):
        if conn == None:
            conn=self.conn
        curs = conn.cursor()
        curs.execute("SELECT lastfm_id FROM track_indicies WHERE id = %s", (track_id,))
        return curs.fetchone()

    def get_id_from_label(self, track_label, conn = None):
        if conn == None:
            conn=self.conn
        curs = conn.cursor()
        curs.execute("SELECT id FROM track_indicies WHERE lastfm_id = %s", (track_label,))
        return curs.fetchone()
    
    def get_num_tracks(self, conn=None):
        if conn == None:
            conn=self.conn
        curs = conn.cursor()
        curs.execute("SELECT max(id) FROM track_indicies")
        return curs.fetchone()
    
    def get_transitions(self, track_label, topN, existance_weighting=10000, conn=None):
        if conn == None:
            conn=self.conn
        """currently only works for tracks that have t1 entries"""
        curs = conn.cursor()
        curs.execute("select * from (select lastfm_id,coalesce(count*%s,0)+1 as count from track_indicies left outer join (select t2, count from filtered_transition_table where t1=%s) sub on t2=lastfm_id) sub order by count desc limit %s", (existance_weighting, track_label,topN))
        return curs
        
    def get_scrobble_transition_vector(self, track_label, topN=20, existance_weighting = 10000, conn=None):
        if conn == None:
            conn=self.conn
        num_tracks = self.get_num_tracks()
        this_track = self.get_id_from_label(track_label)
        labels, raw_counts = zip(*list(self.get_transitions(track_label, topN, existance_weighting).fetchall()))
        # for track, count in self.get_non_empty_transitions(track_label):
        #   idx = self.get_id_from_label(track)
        #   transition_vector[idx] += count*existance_weighting
        return labels, np.array(raw_counts, dtype=np.float64)
        
    def get_personal_recs(self, labels, transition_vector):
        pass
    
    def select_next_track(self, track_label, conn = None, topN = 20):
        if conn == None:
            conn=self.conn
        labels, transition_vector = self.get_scrobble_transition_vector(track_label, topN)
        if self.user != None:
            print "in personalization..."
            transition_vector = self.get_personal_recs(labels, transition_vector)
        all_counts = transition_vector.sum()
        print "raw counts:", transition_vector[:10]
        transition_vector = transition_vector / all_counts
        print "raw counts:", transition_vector[:10]
        transition_distribution = stats.rv_discrete(values=(np.arange(len(labels)),transition_vector))
        picked_id = transition_distribution.rvs()
        print "picked id:", picked_id
        print transition_distribution.stats()
        selected_label = labels[picked_id]
        while selected_label == track_label:
            print "avoiding self loops"
            selected_label = labels[transition_distribution.rvs()]
        return selected_label
            
            

class markovishTests(unittest.TestCase):
    def setUp(self):
        pass


if __name__ == '__main__':
    unittest.main()