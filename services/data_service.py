import json
import os

class DataService:
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

    def load_incidents(self):
        try:
            with open(os.path.join(self.data_dir, 'incidents.json'), 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return []

    def load_runbooks(self):
        try:
            with open(os.path.join(self.data_dir, 'runbooks.json'), 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return []

    def load_postmortems(self):
        try:
            with open(os.path.join(self.data_dir, 'postmortems.json'), 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return []

    def save_postmortem(self, postmortem_data):
        postmortems = self.load_postmortems()
        postmortems.append(postmortem_data)
        with open(os.path.join(self.data_dir, 'postmortems.json'), 'w') as f:
            json.dump(postmortems, f, indent=2)

data_service = DataService()
