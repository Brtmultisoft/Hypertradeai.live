
const dayJs = require('dayjs');

/**
 * Create an object composed of the picked object properties
 * @param {Object} object
 * @param {string[]} keys
 * @returns {Object}
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

const search = (search, fields) => {
  return {
    $or: fields.reduce((arr, key) => {
      let obj = {};
      obj[key] = { $regex: search, $options: "i" };
      arr.push(obj);
      return arr;
    }, [])
  }
};

const advancseSearch = (object, fields) => {
  return fields.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = { $regex: object[key], $options: "i" };
    }
    return obj;
  }, {})
};

const dateSearch = (object, field) => {
  let fkey = `${field}_from`;
  let tkey = `${field}_to`;
  let params = {};

  if (object && Object.prototype.hasOwnProperty.call(object, fkey) && Object.prototype.hasOwnProperty.call(object, tkey)) {
    let fd = new Date(object[fkey]);
    let d = new Date(object[tkey]);
    d.setDate(d.getDate() + 1); // +1 day
    params[field] = {
      $gte: new Date(fd.toISOString().substring(0, 10)),
      $lt: new Date(d.toISOString().substring(0, 10))
    }
  }
  else if (object && Object.prototype.hasOwnProperty.call(object, fkey)) {
    let fd = new Date(object[fkey]);
    params[field] = {
      $gte: new Date(fd.toISOString().substring(0, 10)),
    }
  }
  else if (object && Object.prototype.hasOwnProperty.call(object, tkey)) {
    let d = new Date(object[tkey]);
    d.setDate(d.getDate() + 1); // +1 day
    params[field] = {
      $lt: new Date(d.toISOString().substring(0, 10))
    }
  }
  return params;
};

const statusSearch = (object, fields) => {
  return fields.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // Handle boolean values
      if(object[key] == 'true' || object[key] == true || object[key] == 'false' || object[key] == false){
        obj[key] = object[key] == 'true' || object[key] == true || object[key] == 1 ? true : false;
      }
      // Handle string status values like 'active', 'completed', etc.
      else if(typeof object[key] === 'string' && object[key].trim() !== '') {
        obj[key] = object[key];
      }
    }
    return obj;
  }, {})
};

const AddOrSubractDate = (date = new Date(), number = 0, type = '+day', first = 'no') => {
  if (type == '+day') {
    date.setDate(date.getDate() + number);
  } else if (type == '-day') {
    date.setDate(date.getDate() - number);
  } else if (type == '+month') {
    date.setMonth(date.getMonth() + number);
  } else if (type == '-month') {
    date.setMonth(date.getMonth() - number);
  } else if (type == '+year') {
    date.setFullYear(date.getFullYear() + number);
  } else if (type == '-year') {
    date.setFullYear(date.getFullYear() - number);
  }

  if (first == 'date') {
    date.setDate(1);
  }

  if (first == 'month') {
    date.setDate(1);
    date.setMonth(0);
  }

  return dayJs(new Date(date)).format('YYYY-MM-DD');
};

const inSearch = (object, field) => {
  let params = {};

  if (object && Object.prototype.hasOwnProperty.call(object, field)) {
    params[field] = { $in: object[field].split(",") }
  }
  return params;
};

module.exports = {
  pick,
  search,
  advancseSearch,
  dateSearch,
  statusSearch,
  AddOrSubractDate,
  inSearch
};