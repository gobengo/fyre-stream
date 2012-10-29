(function(exports) {

function App (opts) {
	this._options = opts;
	this._streamHubSdk = opts.streamHubSdk;
	this._collection = this._getCollectionFromOptions(opts.collection);
	this.el = this._getElementFromOptions(opts.el);
	console.log("App initialized", opts);
	if ( ! opts.delayLoad ) {
		console.log("Loading App.");
		this.load(function() {
			console.log("Loaded. Streaming.");
			this.stream();
		})
	}
}

/*
 * Load the initial data to display in the app, and render it
 */
App.prototype.load = function (cb) {
	var self = this;
	this._collection.getInitialData(onSuccess, onError);
	function onSuccess (response) {
		console.log("Got initial data", response);
		self._handleSdkResponse.apply(self, [response]);
		if (typeof(cb) === 'function') {
			cb.call(self);
		}
	}
	function onError () {
		console.log("Error getting initial data for collection", arguments)
	}
}

/*
 * Stream for new data in the collection
 */
App.prototype.stream = function () {
	var self = this;
	console.log("Starting stream");
	this._collection.startStream(onSuccess, onError);
	function onSuccess (data) {
		console.log("Stream success", arguments);
		self._handleSdkResponse.apply(self, [data]);
	}
	function onError () {
		console.log("Stream error", arguments);
	}
}

/*
 * Given a content item from the SDK, render it in the App's element
 */
App.prototype.renderContent = function (content) {
	// Ignore non-visible Content
	if (content.vis !== 1) return
	var authorId = content.content.authorId
	  , author = this._collection.getAuthor(authorId)
	  , contentEl = document.createElement('div')
	  , contentHtml = '';
	console.log("Rendering Content", content, author);
	contentEl.classList.add('content');
	contentHtml += '<span class="author">' + author.displayName + ': </span>';
	contentHtml += '<div class="body">';
	contentHtml += content.content.bodyHtml;
	contentHtml += '</div>';
	contentEl.innerHTML = contentHtml;
	this.el.appendChild(contentEl);
}

/*
 * Handle the raw response from the SDK data methods, then delegate to renderContent
 */
App.prototype._handleSdkResponse = function (response) {
	// We only care about public data
	var publicData = response.public;
	for (var key in publicData) {
		if (publicData.hasOwnProperty(key)) {
			this.renderContent(publicData[key]);
		}
	}
}

App.prototype._getCollectionFromOptions = function (collectionOptions) {
	if (this._collection) return this._collection;
	var collectionOptions = collectionOptions || this._options.collection;
	// Collection Options required.
	if ( ! collectionOptions || typeof collectionOptions !== 'object' ) 
		throw new Error("No Collection options passed to App");

	// siteId and articleId required in collectionOptions
	var siteId = collectionOptions['siteId']
	  , articleId = collectionOptions['articleId'];
	if ( ! siteId ) throw new Error("No siteId in Collection options");
	if ( ! articleId ) throw new Error("No articleId in Collection options");

	var sdkCollection = this._streamHubSdk.getCollection({
		siteId: siteId,
		articleId: articleId
	});

	return sdkCollection;
}

App.prototype._getElementFromOptions = function (elOption) {
	if (this.el) return this.el;
	if ( ! elOption ) throw new Error("No 'el' option passed");
	if ( typeof HTMLElement === 'function' && elOption instanceof HTMLElement) return elOption;
	return document.getElementById(elOption);
}

exports.App = App;
}(this));