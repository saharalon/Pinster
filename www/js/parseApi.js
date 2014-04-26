function User() {

	var obj = {};

	//------------
	// Events
	//------------

	obj.addEvent = function (adderss, title, desc, category, img) {
		// todo
	};

	// function removeEvent() ??

	obj.searchEvent = function (address, radius) {
		// todo
	};

	//------------
	// Settings
	//------------

	obj.settings = {

		address: "",
		category: "",
		radius: 1000,

		setAddress : function (address) {
			this.address = address;
			localStorage.setItem("pinsterSettings", JSON.stringify(this));
		},

		setCategory : function (category) {
			this.category = category;
			localStorage.setItem("pinsterSettings", JSON.stringify(this));
		},

		setRadius : function (radius) {
			this.radius = radius;
			localStorage.setItem("pinsterSettings", JSON.stringify(this));
		},

		init : function() {

			var that = this;

		    if (!localStorage.pinsterSettings || localStorage.pinsterSettings == 'undefined') {
		    	localStorage.setItem("pinsterSettings", JSON.stringify({
					address: "",
					category: "",
					radius: 1000
				}));
		    }
		    else {
		    	var tmpObj = JSON.parse(localStorage.getItem("pinsterSettings"));
		    	that.address = tmpObj.address;
		    	that.category = tmpObj.category;
		    	that.radius = tmpObj.radius;
		    }
		}

	};

	return obj;

}