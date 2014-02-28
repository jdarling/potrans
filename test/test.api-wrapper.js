var assert = require('assert')
  //, nock = require('nock')
  , lib = require('../index')
  , path = require('path')
  , fs = require('fs')
  , options = {
    apikey: 'YOURAPIKEY',
    from: 'eng',
    language: 'spa',
    potfileName: path.join(__dirname, './po/test.pot'),
    pofileName: path.join(__dirname, './po/spa.po')
  }
  ;

require('./nocks');

describe('FreeTranslation.com API wrapper', function(){
  //nock.recorder.rec({dont_print: true});
  describe('Languages', function(){
    var numLangs;
    try{
      fs.unlinkSync(options.pofileName);
    }catch(e){}
    it('Should return a list of languages', function(done){
      lib.getLanguages(options, null, function(err, langs){
        assert(!err, 'Returned an error');
        assert(langs.length, 'Returned languages');
        numLangs = langs.length;
        done();
      });
    });
    it('Should return a filtered list of languages', function(done){
      lib.getLanguages(options, /eng/i, function(err, langs){
        assert(!err, 'Returned an error');
        assert(langs.length<numLangs, 'Returned too many languages');
        done();
      });
    });
    it('Should return details about a language', function(done){
      lib.getLanguages(options, 'eng', function(err, lang){
        assert(!err, 'Returned an error');
        assert(lang, 'Must return a language');
        assert(lang.name='English', 'Return wrong language');
        done();
      });
    });
  });
  describe('Translation', function(){
    var po;
    it('Should create a PO file from a POT file', function(done){
      lib.load(options, function(err, _po){
        assert(!err, err);
        assert(_po, 'Returned a po file object');
        po = _po;
        lib.translateStrings(options, po, function(err, response){
          assert(!err, err);
          assert(response.total===2, 'Didn\'t translate 2 strings');
          done();
        });
      });
    });
    it('Should do nothing when no changes were made', function(done){
      lib.translateStrings(options, po, function(err, response){
        assert(!err, err);
        assert(response.total===0, 'Translated strings');
        done();
      });
    });
    it('Should update a PO file from a POT file', function(done){
      po.items[1].msgstr = '';
      lib.translateStrings(options, po, function(err, response){
        assert(!err, err);
        assert(response.total===1, 'Translated more than 1 difference');
        done();
        //fs.writeFileSync(path.join(__dirname, './nocks.js'), 'var nock = require(\'nock\');\r\n\r\n'+nock.recorder.play().join('\r\n'));
      });
    });
  });
});
