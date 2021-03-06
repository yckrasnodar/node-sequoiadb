/**
 *      Copyright (C) 2015 SequoiaDB Inc.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

'use strict';

var expect = require('expect.js');
var common = require('./common');
var Collection = require('../lib/collection');
var CollectionSpace = require('../lib/collection_space');

describe('Connection js', function () {
  var client = common.createClient();
  var collection;

  var spaceName = 'foo6';
  var collectionName = "bar5";

  before(function (done) {
    this.timeout(8000);
    client.ready(function () {
      var createCollection = function (space) {
        space.createCollection(collectionName, function (err, _collection) {
          expect(err).not.to.be.ok();
          expect(_collection).to.be.a(Collection);
          collection = _collection;
          done();
        });
      };
      client.createCollectionSpace(spaceName, function (err, space) {
        if (err) {
          client.getCollectionSpace(spaceName, function (err, _space) {
            expect(err).not.to.be.ok();
            createCollection(_space);
          });
        } else {
          expect(space).to.be.a(CollectionSpace);
          expect(space.name).to.be(spaceName);
          createCollection(space);
        }
      });
    });
  });

  after(function (done) {
    client.dropCollectionSpace(spaceName, function (err) {
      expect(err).not.to.be.ok();
      client.disconnect(done);
    });
  });

  it("set read from master first", function(done){
    var option = {"PreferedInstance":"M"};
    client.setSessionAttr(option, function (err) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it("execUpdate should ok", function (done) {
    // insert English
    var sql = "INSERT INTO " + spaceName + "." + collectionName +
                " ( c, d, e, f ) values( 6.1, \"8.1\", \"aaa\", \"bbb\")";
    client.execUpdate(sql, function (err) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it("exec should ok", function (done) {
    var sql = "SELECT * FROM " + spaceName + "." + collectionName;
    client.exec(sql, function (err, cursor) {
      expect(err).not.to.be.ok();
      cursor.current(function (err, item) {
        expect(err).not.to.be.ok();
        expect(item).to.be.ok();
        done();
      });
    });
  });

  it('createProcedure should ok', function (done) {
    var code = function sum(x,y){return x+y;};
    client.createProcedure(code, function (err) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it("evalJS should ok", function (done) {
    client.evalJS("sum(1,2)", function (err, result) {
      expect(err).not.to.be.ok();
      expect(result).to.be.ok();
      var cursor = result.cursor;
      cursor.current(function (err, item) {
        expect(err).not.to.be.ok();
        expect(item).to.be.ok();
        done();
      });
    });
  });

  it("getProcedures should ok", function (done) {
    client.getProcedures({"name":"sum"}, function (err, cursor) {
      expect(err).not.to.be.ok();
      cursor.current(function (err, item) {
        expect(err).not.to.be.ok();
        expect(item).to.be.ok();
        done();
      });
    });
  });

  it('removeProcedure should ok', function (done) {
    client.removeProcedure('sum', function (err) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it("getProcedures should ok", function (done) {
    client.getProcedures({"name":"sum"}, function (err, cursor) {
      expect(err).not.to.be.ok();
      cursor.current(function (err, item) {
        expect(err).not.to.be.ok();
        expect(item).to.be(null);
        done();
      });
    });
  });
});
