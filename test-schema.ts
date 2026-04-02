import handler from './api/schema.ts';

const req = {
  method: 'GET',
  headers: {},
  query: {}
};

const res = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('Status:', this.statusCode);
    console.log('Data:', JSON.stringify(data, null, 2));
  },
  setHeader: function() {},
  end: function() {}
};

handler(req, res);
