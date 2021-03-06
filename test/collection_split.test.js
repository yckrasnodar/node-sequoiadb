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
var Node = require('../lib/node');

describe('Collection split', function () {
  var client = common.createClient();
  var _collection;
  var _space;

  var srcGroup;
  var dstGroup;

  var spaceName = 'foo5';
  var collectionName = "bar5";

  before(function (done) {
    this.timeout(8000);
    client.ready(done);
  });

  after(function (done) {
    client.disconnect(done);
  });

  it('create collection space should ok', function(done){
    client.createCollectionSpace(spaceName, function (err, space) {
      expect(err).not.to.be.ok();
      expect(space).not.to.be(null);
      expect(space.name).to.be(spaceName);
      _space = space;
      done();
    });
  });

  it('create source group should ok', function (done) {
    client.createReplicaGroup("source", function (err, group) {
      expect(err).not.to.be.ok();
      expect(group).not.to.be(null);
      srcGroup = group;
      done();
    });
  });

  it('source group create node should ok', function (done) {
    this.timeout(8000);
    var host = common.ip;
    var port = 22000;
    var dbpath = common.dbpath + 'data/22000';
    srcGroup.createNode(host, port, dbpath, {}, function (err, _) {
      expect(err).not.to.be.ok();
      expect(_).to.be.a(Node);
      done();
    });
  });

  it('activate source group should ok', function (done) {
    this.timeout(20000);
    client.activateReplicaGroup('source', function (err, _) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it('create collection on source group should ok', function(done){
    var options = {ShardingKey: {"age": 1}, ShardingType: "hash", Partition: 4096, Group:"source"};
    _space.createCollection(collectionName, options, function (err, collection) {
      expect(err).not.to.be.ok();
      expect(collection).to.be.a(Collection);
      _collection = collection;
      done();
    });
  });

  it('create dest group should ok', function(done){
    client.createReplicaGroup("dest", function(err, group){
      expect(err).not.to.be.ok();
      expect(group).not.to.be(null);
      dstGroup = group;
      done();
    });
  });

  it('create node for dest group should ok', function (done) {
    this.timeout(8000);
    var host = common.ip;
    var port = 22010;
    var dbpath = common.dbpath + 'data/22010';
    dstGroup.createNode(host, port, dbpath, {}, function(err, _){
      expect(err).not.to.be.ok();
      expect(_).to.be.a(Node);
      done();
    });
  });

  it('wait for 10s', function(done) {
    this.timeout(11000);
    setTimeout(function () {
      done();
    }, 10000);
  });

  it('activate dest group should ok', function (done) {
    this.timeout(20000);
    client.activateReplicaGroup('dest', function (err, _) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it('split should ok', function (done) {
    this.timeout(8000);
    var splitCondition = {age: 30};
    var splitEndCondition = {age: 60};
    _collection.split('source', 'dest', splitCondition, splitEndCondition, function (err, cursor) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it('wait for 10s', function(done) {
    this.timeout(11000);
    setTimeout(function () {
      done();
    }, 10000);
  });

  it('splitByPercent should ok', function (done) {
    this.timeout(8000);
    _collection.splitByPercent('source', 'dest', 50, function (err, cursor) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it('wait for 10s', function(done) {
    this.timeout(11000);
    setTimeout(function () {
      done();
    }, 10000);
  });

  it('splitAsync should ok', function (done) {
    this.timeout(8000);
    var splitCondition = {age: 10};
    var splitEndCondition = {age: 30};
    _collection.splitAsync('source', 'dest', splitCondition, splitEndCondition, function (err, cursor) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it('splitByPercentAsync should ok', function (done) {
    this.timeout(8000);
    _collection.splitByPercentAsync('source', 'dest', 50, function (err, cursor) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it('drop collection space should ok', function (done) {
    client.dropCollectionSpace(spaceName, function (err) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it('remove source group should ok', function (done) {
    this.timeout(10000);
    client.removeReplicaGroup('source', function (err, _) {
      expect(err).not.to.be.ok();
      done();
    });
  });

  it('remove dest group should ok', function (done) {
    this.timeout(10000);
    client.removeReplicaGroup('dest', function (err, _) {
      expect(err).not.to.be.ok();
      done();
    });
  });
});
