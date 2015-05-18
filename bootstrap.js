// Imports
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
Cu.import('resource:///modules/CustomizableUI.jsm');
Cu.import('resource://gre/modules/devtools/Console.jsm');
Cu.import('resource://gre/modules/FileUtils.jsm');
Cu.import('resource://gre/modules/osfile.jsm');
Cu.import('resource://gre/modules/Promise.jsm');
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/XPCOMUtils.jsm');

// Globals
const core = {
	addon: {
		name: 'MiguelSaldivar',
		id: 'MiguelSaldivar@jetpack',
		path: {
			name: 'miguelsaldivar',
			content: 'chrome://miguelsaldivar/content/',
			locale: 'chrome://miguelsaldivar/locale/',
			resources: 'chrome://miguelsaldivar/content/resources/',
			images: 'chrome://miguelsaldivar/content/resources/images/'
		}
	},
	os: {
		name: OS.Constants.Sys.Name.toLowerCase()
	}
};
const cui_cssUri = Services.io.newURI(core.addon.path.resources + 'cui.css', null, null);
const NS_HTML = 'http://www.w3.org/1999/xhtml';
const NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

// Lazy Imports
const myServices = {};
XPCOMUtils.defineLazyGetter(myServices, 'sb', function () { return Services.strings.createBundle(core.addon.path.locale + 'global.properties?' + Math.random()); /* Randomize URI to work around bug 719376 */ });

// START - Addon Functionalities
function doit() {
	// blah
}
// END - Addon Functionalities

/*start - windowlistener*/
var windowListener = {
	//DO NOT EDIT HERE
	onOpenWindow: function (aXULWindow) {
		// Wait for the window to finish loading
		var aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
		aDOMWindow.addEventListener('load', function () {
			aDOMWindow.removeEventListener('load', arguments.callee, false);
			windowListener.loadIntoWindow(aDOMWindow);
		}, false);
	},
	onCloseWindow: function (aXULWindow) {},
	onWindowTitleChange: function (aXULWindow, aNewTitle) {},
	register: function () {
		
		// Load into any existing windows
		let DOMWindows = Services.wm.getEnumerator(null);
		while (DOMWindows.hasMoreElements()) {
			let aDOMWindow = DOMWindows.getNext();
			if (aDOMWindow.document.readyState == 'complete') { //on startup `aDOMWindow.document.readyState` is `uninitialized`
				windowListener.loadIntoWindow(aDOMWindow);
			} else {
				aDOMWindow.addEventListener('load', function () {
					aDOMWindow.removeEventListener('load', arguments.callee, false);
					windowListener.loadIntoWindow(aDOMWindow);
				}, false);
			}
		}
		// Listen to new windows
		Services.wm.addListener(windowListener);
	},
	unregister: function () {
		// Unload from any existing windows
		let DOMWindows = Services.wm.getEnumerator(null);
		while (DOMWindows.hasMoreElements()) {
			let aDOMWindow = DOMWindows.getNext();
			windowListener.unloadFromWindow(aDOMWindow);
		}
		//Stop listening so future added windows dont get this attached
		Services.wm.removeListener(windowListener);
	},
	//END - DO NOT EDIT HERE
	loadIntoWindow: function (aDOMWindow) {
		if (!aDOMWindow) { return }
		
		if (aDOMWindow.gBrowser) {
			var domWinUtils = aDOMWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
			domWinUtils.loadSheet(cui_cssUri, domWinUtils.AUTHOR_SHEET);
		}
	},
	unloadFromWindow: function (aDOMWindow) {
		if (!aDOMWindow) { return }
		
		if (aDOMWindow.gBrowser) {
			var domWinUtils = aDOMWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
			domWinUtils.removeSheet(cui_cssUri, domWinUtils.AUTHOR_SHEET);
			
			var doc = aDOMWindow.document;
			var panel = doc.getElementById('miguelsaldivar-view-panel');
			panel.parentNode.removeChild(panel);
		}
	}
};
/*end - windowlistener*/

function install() {}
function uninstall() {}

function startup(aData, aReason) {
	
	CustomizableUI.createWidget({
		id: 'cui_miguelsaldivar',
		defaultArea: CustomizableUI.AREA_NAVBAR,
		label: myServices.sb.GetStringFromName('cui_miguelsaldivar_lbl'),
		tooltiptext: myServices.sb.GetStringFromName('cui_miguelsaldivar_tip'),
		type: 'view',
		viewId : 'miguelsaldivar-view-panel',
		onBeforeCreated: function(aDoc) {
			var aDOMWin = aDoc.defaultView;
			
			var doc = aDOMWin.document;
			var panel = doc.createElementNS(NS_XUL, 'panelview');
			var iframe = doc.createElementNS(NS_HTML, 'iframe');
			 
			panel.setAttribute('id', 'miguelsaldivar-view-panel');
			iframe.setAttribute('id', 'miguelsaldivar-view-iframe');
			iframe.setAttribute('type', 'content');
			iframe.setAttribute('src', core.addon.path.resources + 'gui.html');
			 
			panel.appendChild(iframe);
			doc.getElementById('PanelUI-multiView').appendChild(panel);
			
		},
		onViewShowing: function(aEvent) {
			console.log('view showing baby');
			// since the panelview node is moved and the iframe is reset in some
			// cases, this hack ensures that the code runs once the iframe is
			// valid.
			var timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
			timer.initWithCallback({
				notify: function() {
					var aDOMWin = aEvent.target.ownerDocument.defaultView;
					var promise_updateScores = xhr('http://www.bing.com/', {
						aTimeout: 10000,
						aResponseType: 'text'
					});
					promise_updateScores.then(
						function(aVal) {
							console.log('Fullfilled - promise_updateScores - ', aVal);
							// start - do stuff here - promise_updateScores
							aDOMWin.document.getElementById('miguelsaldivar-view-iframe').contentDocument.body.textContent = 'xhr succesful!';
							// end - do stuff here - promise_updateScores
						},
						function(aReason) {
							var rejObj = {name:'promise_updateScores', aReason:aReason};
							console.warn('Rejected - promise_updateScores - ', rejObj);
							Services.prompt.alert(aDOMWin, myServices.sb.GetStringFromName('fetch_fail_title'), myServices.sb.formatStringFromName('fetch_fail_msg', [aReason.aReason], 1));
						}
					).catch(
						function(aCaught) {
							var rejObj = {name:'promise_updateScores', aCaught:aCaught};
							console.error('Caught - promise_updateScores - ', rejObj);
							Services.prompt.alert(aDOMWin, myServices.sb.GetStringFromName('fetch_devfail_title'), myServices.sb.GetStringFromName('fetch_devfail_msg'));
						}
					);
				}
			}, 1000, Ci.nsITimer.TYPE_ONE_SHOT);
		},
		onViewHiding: function(aEvent) {
			console.log('view now hiding');
			var aDOMWin = aEvent.target.ownerDocument.defaultView;
			aDOMWin.document.getElementById('miguelsaldivar-view-iframe').contentDocument.body.textContent = 'panel closed';
		}
	});
	
	//windowlistener more
	windowListener.register();
	//end windowlistener more
}

function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN) { return }
	
	CustomizableUI.destroyWidget('cui_miguelsaldivar');
	
	//windowlistener more
	windowListener.unregister();
	//end windowlistener more

}

// start - common helper functions
function Deferred() {
	if (Promise && Promise.defer) {
		//need import of Promise.jsm for example: Cu.import('resource:/gree/modules/Promise.jsm');
		return Promise.defer();
	} else if (PromiseUtils && PromiseUtils.defer) {
		//need import of PromiseUtils.jsm for example: Cu.import('resource:/gree/modules/PromiseUtils.jsm');
		return PromiseUtils.defer();
	} else if (Promise) {
		try {
			/* A method to resolve the associated Promise with the value passed.
			 * If the promise is already settled it does nothing.
			 *
			 * @param {anything} value : This value is used to resolve the promise
			 * If the value is a Promise then the associated promise assumes the state
			 * of Promise passed as value.
			 */
			this.resolve = null;

			/* A method to reject the assocaited Promise with the value passed.
			 * If the promise is already settled it does nothing.
			 *
			 * @param {anything} reason: The reason for the rejection of the Promise.
			 * Generally its an Error object. If however a Promise is passed, then the Promise
			 * itself will be the reason for rejection no matter the state of the Promise.
			 */
			this.reject = null;

			/* A newly created Pomise object.
			 * Initially in pending state.
			 */
			this.promise = new Promise(function(resolve, reject) {
				this.resolve = resolve;
				this.reject = reject;
			}.bind(this));
			Object.freeze(this);
		} catch (ex) {
			console.error('Promise not available!', ex);
			throw new Error('Promise not available!');
		}
	} else {
		throw new Error('Promise not available!');
	}
}

function xhr(aStr, aOptions={}) {
	// currently only setup to support GET and POST
	// does an async request
	// aStr is either a string of a FileURI such as `OS.Path.toFileURI(OS.Path.join(OS.Constants.Path.desktopDir, 'test.png'));` or a URL such as `http://github.com/wet-boew/wet-boew/archive/master.zip`
	// Returns a promise
		// resolves with xhr object
		// rejects with object holding property "xhr" which holds the xhr object
	
	/*** aOptions
	{
		aLoadFlags: flags, // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/NsIRequest#Constants
		aTiemout: integer (ms)
		isBackgroundReq: boolean, // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Non-standard_properties
		aResponseType: string, // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Browser_Compatibility
		aPostData: string
	}
	*/
	
	var aOptions_DEFAULT = {
		aLoadFlags: Ci.nsIRequest.LOAD_ANONYMOUS | Ci.nsIRequest.LOAD_BYPASS_CACHE | Ci.nsIRequest.INHIBIT_PERSISTENT_CACHING,
		aPostData: null,
		aResponseType: 'text',
		isBackgroundReq: true, // If true, no load group is associated with the request, and security dialogs are prevented from being shown to the user
		aTimeout: 0 // 0 means never timeout, value is in milliseconds
	}
	
	for (var opt in aOptions_DEFAULT) {
		if (!(opt in aOptions)) {
			aOptions[opt] = aOptions_DEFAULT[opt];
		}
	}
	
	// Note: When using XMLHttpRequest to access a file:// URL the request.status is not properly set to 200 to indicate success. In such cases, request.readyState == 4, request.status == 0 and request.response will evaluate to true.
	
	var deferredMain_xhr = new Deferred();
	console.log('here222');
	let xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);

	let handler = ev => {
		evf(m => xhr.removeEventListener(m, handler, !1));

		switch (ev.type) {
			case 'load':
			
					if (xhr.readyState == 4) {
						if (xhr.status == 200) {
							deferredMain_xhr.resolve(xhr);
						} else {
							var rejObj = {
								name: 'deferredMain_xhr.promise',
								aReason: 'Load Not Success', // loaded but status is not success status
								xhr: xhr,
								message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
							};
							deferredMain_xhr.reject(rejObj);
						}
					} else if (xhr.readyState == 0) {
						var uritest = Services.io.newURI(aStr, null, null);
						if (uritest.schemeIs('file')) {
							deferredMain_xhr.resolve(xhr);
						} else {
							var rejObj = {
								name: 'deferredMain_xhr.promise',
								aReason: 'Load Failed', // didnt even load
								xhr: xhr,
								message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
							};
							deferredMain_xhr.reject(rejObj);
						}
					}
					
				break;
			case 'abort':
			case 'error':
			case 'timeout':
				
					var rejObj = {
						name: 'deferredMain_xhr.promise',
						aReason: ev.type[0].toUpperCase() + ev.type.substr(1),
						xhr: xhr,
						message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
					};
					deferredMain_xhr.reject(rejObj);
				
				break;
			default:
				var rejObj = {
					name: 'deferredMain_xhr.promise',
					aReason: 'Unknown',
					xhr: xhr,
					message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
				};
				deferredMain_xhr.reject(rejObj);
		}
	};

	let evf = f => ['load', 'error', 'abort'].forEach(f);
	evf(m => xhr.addEventListener(m, handler, false));

	if (aOptions.isBackgroundReq) {
		xhr.mozBackgroundRequest = true;
	}
	
	if (aOptions.aTimeout) {
		xhr.timeout
	}
	
	if (aOptions.aPostData) {
		xhr.open('POST', aStr, true);
		xhr.channel.loadFlags |= aOptions.aLoadFlags;
		xhr.responseType = aOptions.aResponseType;
		xhr.send(aOptions.aPostData);		
	} else {
		xhr.open('GET', aStr, true);
		xhr.channel.loadFlags |= aOptions.aLoadFlags;
		xhr.responseType = aOptions.aResponseType;
		xhr.send(null);
	}
	
	return deferredMain_xhr.promise;
}
// end - common helper functions