const { expect } = require('chai');
const normalize = require('../../../src/helpers/normalize-models');

const basic = {
  posts: {
    table: 'post',
    idKey: '_id',
    attrs: [ 'a', { key: 'b', serialize: () => 1, deserialize: () => 2 } ],
    relationships: [ { key: 'c', type: 't', via: { table: 'x', pk: 'y', fk: 'z' } } ]
  }
};

describe('normalize models', function() {
  let basicNormalized;

  before(() => basicNormalized = normalize(basic));

  describe('table name', function() {
    it('is passed through', function() {
      expect(basicNormalized.posts.table).to.equal('post');
    });
  });

  describe('idKey', function() {
    it('is passed through if provided', function() {
      expect(basicNormalized.posts.idKey).to.equal('_id');
    });

    it(`defaults to 'id'`, function() {
      expect(normalize({ posts: { table: 'post' } }).posts.idKey).to.equal('id');
    });
  });

  describe('attrs', function() {
    let attrs;

    before(() => attrs = basicNormalized.posts.attrs);

    it('converts to object form', function() {
      expect(attrs).to.have.lengthOf(2);

      expect(attrs[0].key).to.equal('a');
      expect(attrs[0]).to.have.property('serialize');
      expect(attrs[0]).to.have.property('deserialize');

      expect(attrs[1].key).to.equal('b');
      expect(attrs[1]).to.have.property('serialize');
      expect(attrs[1]).to.have.property('deserialize');
    });

    it('passes through serializers and deserializers if present', function() {
      expect(attrs[1].serialize(0)).to.equal(1);
      expect(attrs[1].deserialize(0)).to.equal(2);
    });

    it('applies default serializers and deserializers if not present', function() {
      expect(attrs[0].serialize(0)).to.equal(0);
      expect(attrs[0].deserialize(0)).to.equal(0);
    });
  });

  describe('relationships', function() {
    let rels;

    before(() => rels = basicNormalized.posts.relationships);

    it('passes through relationships', function() {
      expect(rels).to.have.lengthOf(1);

      expect(rels[0].key).to.equal('c');
      expect(rels[0].type).to.equal('t');
      expect(rels[0].via.table).to.equal('x');
      expect(rels[0].via.pk).to.equal('y');
      expect(rels[0].via.fk).to.equal('z');
    });
  });

  describe('immutability', function() {
    it('creates a new models object', function() {
      expect(basicNormalized).to.not.equal(basic);
    });

    it('creates new model objects', function() {
      expect(basicNormalized.posts).to.not.equal(basic.posts);
    });

    it('creates new attr arrays', function() {
      expect(basicNormalized.posts.attrs).to.not.equal(basic.posts.attrs);
    });

    it('creates new attr objects', function() {
      expect(basicNormalized.posts.attrs[1]).to.not.equal(basic.posts.attrs[1]);
    });

    it('creates new relationship arrays', function() {
      expect(basicNormalized.posts.relationships).to.not.equal(basic.posts.relationships);
    });

    it('creates new relationship objects', function() {
      expect(basicNormalized.posts.relationships[0]).to.not.equal(basic.posts.relationships[0]);
    });

    it('creates new relationship via objects', function() {
      expect(basicNormalized.posts.relationships[0].via).to.not.equal(basic.posts.relationships[0].via);
    });
  });
});
