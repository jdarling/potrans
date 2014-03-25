var pofile = require('pofile')
  , request = require('request')
  , pjson = require('./package.json')
  , async = require('async')
  , path = require('path')
  , endpoint = 'https://lc-api.sdl.com/translate'
  , assert = require('assert')
  , fs = require('fs')
  , langs = require('./langs.json')
  ;

var tostr = function(seg){
  return seg instanceof Array?seg.join(' ').trim():seg;
};

var get = module.exports.get = function(options, endpoint, args, callback){
  var uri = 'https://lc-api.sdl.com/'+endpoint+'?apiKey='+options.apikey;
  var keys = Object.keys(args||{}), value;
  keys.forEach(function(key){
    value = args[key];
    uri += '&' + key + '=' + value;
  });
  request.get(uri, callback);
};

var post = module.exports.post = function(options, endpoint, args, body, callback){
  var uri = 'https://lc-api.sdl.com/'+endpoint+'?apiKey='+options.apikey;
  var keys = Object.keys(args||{}), value;
  keys.forEach(function(key){
    value = args[key];
    uri += '&' + key + '=' + value;
  });
  request({
    method: 'POST',
    uri: uri,
    json: body
  },
  callback);
};

var getLocale = function(fromCode){
  var result = '', i, l = langs.length;
  for(i=0; i<l; i++){
    if(langs[i].code === fromCode){
      return langs[i].locale;
    }
  }
  return result;
};

var _getLanguages = (function(){
  var cache = {};
  return function(options, callback){
    var key = JSON.stringify(options), res;
    if(res = cache[key]){
      return callback(null, res.response, res.body);
    }

    return get(options, 'languages', false, function(error, response, body){
      if(!error){
        cache[key] = {
          response: response,
          body: body
        };
      }
      callback(error, response, body);
    });
  };
})();

var getLanguages = module.exports.getLanguages = function(options, filter, callback){
  var reMatch = (typeof(filter)==='boolean')?/./:(function(){
    if(filter instanceof RegExp){
      return filter;
    }else if(!filter){
      return /./;
    }
    var parts = filter.split('/');
    var options = 'gi';
    if(parts[0]===''){
      parts.shift();
      options = parts.pop();
      filter = parts.join('/');
    }
    return new RegExp(filter, options);
  })();
  _getLanguages(options, function(error, response, body){
    try{
      var json = JSON.parse(body);
      var translations = json.languageExpertise.Q1;
      var seen = [];
      var results = [];
      var langsFound = 0;

      if(options.useQ2){
        translations.concat(json.languageExpertise.Q2||[]);
      }
      if(options.useQ3){
        translations.concat(json.languageExpertise.Q3||[]);
      }
      if(options.useQ4){
        translations.concat(json.languageExpertise.Q4||[]);
      }
      if(options.useQ5){
        translations.concat(json.languageExpertise.Q5||[]);
      }
      
      translations.forEach(function(l){
        if((l.languagePair.to.name.match(reMatch)||l.languagePair.to.fullName.match(reMatch)) && seen.indexOf(l.languagePair.to.name)===-1){
          results.push(l.languagePair.to);
          langsFound++;
          seen.push(l.languagePair.to.name);
        }
      });
      callback(null, results);
    }catch(e){
      e.body = body;
      callback(e);
    }
  });
};

var getLanguage = module.exports.getLanguage = function(options, code, callback){
  getLanguages(options, false, function(err, list){
    if(err){
      return callback(err);
    }
    var i, l=list.length;
    for(i=0; i<l; i++){
      if(list[i].code === code){
        return callback(null, list[i]);
      }
    }
    return callback(null, false);
  });
};

var listLanguages = module.exports.listLanguages = function(options, filter, callback){
  getLanguages(options, filter, function(err, list){
    var result = {};
    if(err){
      return callback(err);
    }
    list.forEach(function(lang){
      result[lang.fullName||lang.name] = lang.code;
    });
    callback(null, result);
  });
};

var loadPot = function(options, callback, cb){
  pofile.load(options.potfileName, function(err, pot){
    if(err){
      return callback(err);
    }
    return cb(pot);
  });
};

var loadPo = function(options, callback, cb){
  fs.exists(options.pofileName, function(exists){
    if(!exists){
      return cb(false);
    }
    pofile.load(options.pofileName, function(err, po){
      if(err){
        return callback(err);
      }
      return cb(po);
    });
  });
};

var mergeCullPo = function(options, pot, po, cb){
  var poIndexes = [];
  var potIndexes = [];
  var poItems = po.items;
  var potItems = pot.items;
  var l = poItems.length, i=l-1;
  // Create a quick lookup of all keys in PO
  poItems.forEach(function(item){
    poIndexes.push(tostr(item.msgid));
  });
  // Check that all the POT keys exist in PO
  potItems.forEach(function(item){
    var msgid = tostr(item.msgid);
    potIndexes.push(msgid);
    if(poIndexes.indexOf(msgid)===-1){
      po.items.push(item);
    }
  });
  // Remove any keys from PO that are not in POT
  while(i>=0){
    if(potIndexes.indexOf(tostr(po.items[i].msgid))===-1){
      po.items.splice(i, 1);
    }
    i--;
  }
  return cb(null, po);
};

var load = module.exports.load = function(options, callback){
  loadPot(options, callback, function(pot){
    loadPo(options, callback, function(po){
      getLanguage(options, options.language, function(err, lang){
        if(err){
          return callback(err);
        }
        if(!lang){
          return callback('Could not locate language: '+options.language);
        }
        var res = (po||pot);
        res.headers.Language = options.name||lang.name||lang.fullName;
        res.headers.Locale = getLocale(options.language);
        res.headers['POT-Creation-Date'] = fs.statSync(options.potfileName).ctime;
        res.headers['Last-Translator'] = 'http://www.freetranslation.com/';
        res.headers['Language-Team'] = res.headers['Language-Team']||'http://www.freetranslation.com/';
        res.headers['PO-Revision-Date'] = (new Date()).toString();
        res.headers['Direction'] = lang.rightToLeft?'rtl':'ltr';
        if(po&&pot){
          return mergeCullPo(options, pot, po, callback);
        }
        return callback(null, res);
      });
    });
  });
};

var translateStrings = module.exports.translateStrings = function(options, po, callback){
  var msgStr, toTranslate = [], failed = 0, success = 0, skipped = 0, rtl;
  var log = options.log || function(){};
  po.items.forEach(function(item){
    msgStr = item.msgstr instanceof Array?item.msgstr.join(' ').trim():item.msgstr;
    if(!msgStr){
      toTranslate.push(item);
    }
  });
  async.forEachLimit(toTranslate, options.limitCallsTo||5, function(item, next){
    var msgId = item.msgid instanceof Array?item.msgid.join(' ').trim():item.msgid;
    var postArgs = {
        "text": msgId,
        "from": options.from||"eng",
        "to": options.language
      };
    log('Translating: '+msgId);

    post(options, 'translate', null, postArgs, function(error, response, body){
      if(error){
        log('Failed to translate: ', item.msgid);
        console.log(error);
        failed++;
        return next();
      }else{
        try{
          if(typeof(body)==='string'){
            body = JSON.parse(body);
          }
        }catch(e){
          log('JSON ERROR: Failed to translate: ', item.msgid);
          console.log(e);
          console.log(body);
          failed++;
          return next();
        }
        if(body.errorCode){
          log('Failed to translate: ', item.msgid);
          log(body);
          failed++;
          return next();
        }
        if(body.translation && (!body.partialTranslation)){
          item.msgstr[0] = body.translation;
          success++;
        }else{
          if(body.partialTranslation){
            log('Got a partial translation, skipping: ', item.msgid);
            skipped++;
          }else{
            log('No translation returned: ', item.msgid);
            failed++;
          }
        }
        return next();
      };
    });
  }, function(){
    if(toTranslate.length||options.forceupdate){
      po.save(options.pofileName, function(err){
        if(err){
          return callback(err);
        }
        return callback(null, {
          total: toTranslate.length,
          failed: failed,
          skipped: skipped,
          success: success,
          outfile: options.pofileName,
          saved: true
        });
      });
    }else{
      return callback(null, {
        total: toTranslate.length,
        failed: failed,
        skipped: skipped,
        success: success,
        output: options.pofileName,
        saved: false
      });
    }
  });
};