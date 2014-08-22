/**
 * - belongs to a {@link Installation}
 *
 * @param doc
 * @constructor
 *
 * @property _id
 * @property type
 * @property productId
 * @property locationId
 * @property startTime
 * @property endTime
 * @property visitors{}
 * @property dwellTime
 *
 */
ProductMetric = function(doc) {
  BaseMetric.call(this, doc);
  this.type = ProductMetric.type;
};


ProductMetric.prototype = Object.create(BaseMetric.prototype);
ProductMetric.prototype.constructor = ProductMetric;

ProductMetric.find = function(selector) {
  var finalSelector = {type: ProductMetric.type};
  _.extend(finalSelector, selector);
  return Metrics.find(finalSelector);
};

ProductMetric.findOne = function(selector) {
  var finalSelector = {type: ProductMetric.type};
  _.extend(finalSelector, selector);
  return Metrics.findOne(finalSelector);
};

var upsertProductMetric = function(encounter) { 
  console.log("[ProductMetric] update ProductMetric " + encounter.installationId); 
  var installation = Installations.findOne({_id: encounter.installationId});
      
  var productMetric = ProductMetric.findOne({
    productId: installation.physicalId,
    locationId: installation.locationId,
    startTime: { $lt: encounter.exitAt },
    endTime: { $gt:  encounter.exitAt }

  });

  var startTime = getStartTime();
  if (!productMetric) {
    productMetric = new ProductMetric({
      productId: installation.physicalId,
      locationId: installation.locationId,
      startTime: startTime,
      endTime: new Date(startTime + ProductMetric.interval).getTime()
    });
  }

  productMetric.handleEncounterAdd(encounter);
}

var getStartTime = function() {

  var startTimeExact = new Date(); 
  return new Date(startTimeExact.getFullYear(),
                      startTimeExact.getMonth(),
                      startTimeExact.getDate(),
                      startTimeExact.getHours())
                        .getTime();
}

ProductMetric.prototype.handleEncounterAdd = function(encounter) {
  var visitorId = encounter.visitorId;
  var duration = encounter.duration;

  var selector = {
    productId: this.productId,
    locationId: this.locationId,
    type: this.type
  };

  var modifier = {
    $inc : { dwellTime: duration },
    $addToSet : { visitors : visitorId },
    $set : { startTime : this.startTime, endTime: this.endTime }
  }

  var result = Metrics.upsert(selector, modifier);
  //TODO to a helper function?
  if (result.insertedId) {
    this._id = result.insertedId;
  } else {
    this._id = ProductMetric.findOne(selector)._id;
  }
  return this._id;
}

ProductMetric.prototype.getVisitorsCount = function() {
  return this.visitors.length;
}


ProductMetric.startup = function() {
  Encounters
      .findClosed()
      .observe({
        _suppress_initial: true,
        "added": upsertProductMetric,
      });
}

ProductMetric.type = "product";
ProductMetric.interval = 60 * 60 * 1000 - 1;