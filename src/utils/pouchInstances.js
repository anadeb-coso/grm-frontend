import PouchAsyncStorage from 'pouchdb-adapter-asyncstorage';
import PouchAuth from 'pouchdb-authentication';
import PouchFind from 'pouchdb-find';
import PouchDB from 'pouchdb-react-native';

PouchDB.plugin(PouchAuth);
PouchDB.plugin(PouchFind);
PouchDB.plugin(require('pouchdb-upsert'));
PouchDB.plugin(PouchAsyncStorage);


export const LocalDatabase = new PouchDB('eadl', {
  adapter: 'asyncstorage',
});

LocalDatabase.createIndex({
  index: {
    fields: ['representative.email', 'representative.id', 'type'],
  },
});

export const LocalGRMDatabase = new PouchDB('grm', {
  adapter: 'asyncstorage',
});

LocalGRMDatabase.createIndex({
  index: {
    fields: ['issue', 'assignee.id', 'type', 'confirmed', 'publish', 'reporter.id'],
  },
});
