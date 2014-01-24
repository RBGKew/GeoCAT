
      
      /*==========================================================================================================================*/
    	/*  																																																												*/
    	/*  																																																												*/
    	/*				LayerCustomization => Class to control layers of the map                           																*/
    	/*  																																																												*/
    	/*  																																																												*/
    	/*==========================================================================================================================*/


    	function LayerCustomization (file_layers) {
  		  var me = this;
  		  $('div#layer_window ul').jScrollPane({autoReinitialise:true});
        $('div#layer_window ul,div#layer_window ul li,div#layer_window ul.jspScrollable,div#layer_window ul div.jspContainer, div.scrollable-helper,ul#sources_list div.jspPane').disableSelection();
        $('div#layer_window ul,div#layer_window ul div.jspPane').sortable({
          revert:false,
          items: 'li',
          cursor: 'pointer',
          beforeStop:function(event,ui){
            $(ui.item).removeClass('moving');
            me.sortLayers();
          },
          start:function(event,ui){
            $(ui.item).addClass('moving');
          }
        });
  		  
  		  
  		  $('div#layer_window ul li a.add_layer_link').live('click',function(ev){
  		    ev.stopPropagation();
  		    ev.preventDefault();
  		    var added;
		      if (!$(this).closest('li').hasClass('added')) {
		        $(this).text('ADDED');
		        added = true;
		        $(this).closest('li').addClass('added');
		      } else {
		        $(this).text('ADD');
		        added = false;
		        $(this).closest('li').removeClass('added');
		      }
		      var url = $(this).parent().attr('url');
		      me.layers[url].add = added; 
		      me.addRemoveLayer(url,$(this).parent().attr('type'),added);
  		  });
  		  
  		  
  		  // Import new layers events
  		  $('#import_layer input[type="text"]').live("focusin",function(ev){
  		    ev.stopPropagation();
  		    ev.preventDefault();
  		    var value = $(this).val();
          if (value=="Add source from URL...") {
            $(this).css('color','#666666');
            $(this).css('font','normal 11px Arial');
            $(this).val('');
          }
  		  });
  		  
  		  
  		  $('#import_layer input[type="text"]').live("focusout",function(ev){
  		    ev.stopPropagation();
  		    ev.preventDefault();
  		    var value = $(this).val();
          if (value=="Add source from URL..." || value=="") {
            $(this).css('color','#999999');
            $(this).css('font','italic 11px Arial');
            $(this).val('Add source from URL...');
          }
  		  });
  		  
  		  
  		  $('#import_layer').live("submit",function(ev){
  		    ev.stopPropagation();
  		    ev.preventDefault();
  		    var url = $('#import_layer input[type="text"]').val();
  		    
  		    if (me.layers[url]!=undefined) {
  		      $('span.layer_error p').text('This layer has already been added previously').parent().fadeIn().delay(2000).fadeOut();
  		    } else {
  		      if (url!='') {
      		    me.importLayer(url);
    		    } else {
    		      $('span.layer_error p').text('Write a valid KML or XYZ url...').parent().fadeIn().delay(2000).fadeOut();
    		    }
  		    }
  		  });
  		  
  		  
        $('div#layer_window ul li a.remove_layer').live('click',function(ev){
          var url = $(this).closest('li').attr('url');
          var type = $(this).closest('li').attr('type');
          me.removeLayer(url,type);
        });
        
        
        this.uplaod_layers = [];
  		  _.each(file_layers,function(element){element.add = true;});
  			this.upload_layers = file_layers;
  			this.layers = [];
  			this.getLayers();
  			this.index_layers = 0;
  			this.importation_errors = 0;
  		}



  		/*========================================================================================================================*/
  		/* Get locked layers from repository */
  		/*========================================================================================================================*/
  		LayerCustomization.prototype.getLayers = function() {
  		  var me = this;
  		  this.importation_errors = 0;
  		  $.getJSON("/data/layers.json?12333",function(result){
  		    var layers = result.layers;
  		    if (me.upload_layers!=null) {
    		    layers = layers.concat(me.upload_layers);
  		    }
  		    
  		    for (var i=0; i<layers.length; i++) {
  		      var url = layers[i].url;
  		      if (me.layers[url]==undefined) {
    		      me.addLayer(layers[i].name,layers[i].source_url,layers[i].source_name,layers[i].url,layers[i].opacity,layers[i].type,((layers[i].locked == undefined || layers[i].locked )?true:false),((layers[i].tmsr != undefined)? true : false), ((layers[i].add != undefined)? true : false));
  		      } else {
  		        me.layers[url].add = true;
  		      }
  		    }
  		    
  		    if (this.importation_errors==1) {
  		      $('span.layer_error p').text('There was an error with importing the layers').parent().fadeIn().delay(2000).fadeOut();
  		    } else if (this.importation_errors>1) {
  		      $('span.layer_error p').text('There were '+this.importation_errors+' errors importing the layers').parent().fadeIn().delay(2000).fadeOut();
  		    }
  		    
          for (var i in me.layers) {
            if (me.layers[i].add) {
              $('div#layer_window ul li[url="'+i+'"] ').addClass('added');
    		      me.addRemoveLayer(i,me.layers[i].type,true);
    		      $('div#layer_window ul li[url="'+i+'"] a.add_layer_link').text('ADDED');
    		      me.sortLayers();
            }
          }
  		  });
  		}
  		
  		
  		
  		/*========================================================================================================================*/
  		/* Import a new layer */
  		/*========================================================================================================================*/
  		LayerCustomization.prototype.importLayer = function(url) {
	      this.importation_errors = 0;
	      this.addLayer('','','',url,0.5,'',false,false,true);
	      if (this.importation_errors==1) {
		      $('span.layer_error p').text('Review your layer url, seems to be incorrect').parent().fadeIn().delay(2000).fadeOut();
		    }
  		}
  		
  		
  		
  		
  		/*========================================================================================================================*/
  		/* Add a layer to the list */
  		/*========================================================================================================================*/
  		LayerCustomization.prototype.addLayer = function(name,source_url,source_name,url,opacity,type,locked,tms,add) {
        if (type=='') {
          if (url.search('.kml')!=-1 || url.search('.kmz')!=-1) {
            type = 'kml';
          } else {
            type = 'xyz';
          }
        }

  		  if (type == 'kml') {
  		    var kml_layer = new google.maps.KmlLayer(url, { suppressInfoWindows: true, preserveViewport:true});
  		    if (add) {
    		    kml_layer.setMap(map);
  		    } else {
    		    kml_layer.setMap(null);
  		    }
  		    this.layers[url] = {};
          this.layers[url].name = (name=='')?'User KML layer':name;
    		  this.layers[url].source_url = (source_url=='')?url:source_url;
    		  this.layers[url].source_name = (source_name=='')?'user':source_name;
    		  this.layers[url].opacity = (opacity=='')?0.5:opacity;
    		  this.layers[url].type = type;
    		  this.layers[url].add = add;
          this.layers[url].layer = kml_layer;
          this.layers[url].position = 0;
          
          var api = $('div#layer_window ul').data('jsp');
          if (api) {
            api.getContentPane().prepend('<li url="'+url+'" type="'+type+'" class="'+(add?'added':'')+'"><h4>'+this.layers[url].name+'</h4><span><p>by <a target="_blank" href="'+this.layers[url].source_url+'">'+this.layers[url].source_name+'</a></p>'+
            ((!locked)?'<a class="remove_layer">| Remove</a>':'')+
            '</span><a class="add_layer_link">'+(add?'ADDED':'ADD')+'</a><div class="slider"></div></li>');
            api.reinitialise();  
          }
    		  
  		  } else {
  		    if (url.search('{X}')!=-1 && url.search('{Z}')!=-1 && url.search('{Y}')!=-1) {
  		      var layer = new google.maps.ImageMapType({
              getTileUrl: function(tile, zoom) {
                var y = tile.y;
                var tileRange = 1 << zoom;
                if (y < 0 || y  >= tileRange) {
                  return null;
                }
                if (tms) {
                  y = Math.pow(2, zoom) - tile.y - 1;
                }
                var x = tile.x;
                if (x < 0 || x >= tileRange) {
                  x = (x % tileRange + tileRange) % tileRange;
                }
                return this.urlPattern.replace("{X}",x).replace("{Y}",y).replace("{Z}",zoom);
              },
              tileSize: new google.maps.Size(256, 256),
              opacity:opacity,
              isPng: true,
              urlPattern:url
            });
            
            this.layers[url] = {};
            this.layers[url].name = (name=='')?'User XYZ layer':name;
      		  this.layers[url].source_url = (source_url=='')?url:source_url;
      		  this.layers[url].source_name = (source_name=='')?'user':source_name;
      		  this.layers[url].opacity = (opacity=='')?0.5:opacity;
      		  this.layers[url].type = type;
      		  this.layers[url].add = add;
            this.layers[url].layer = layer;
            this.layers[url].position = this.index_layers;
            
            if (add) {
              map.overlayMapTypes.setAt(this.index_layers,layer);
      		    this.index_layers++;
            }
            
            var api = $('div#layer_window ul').data('jsp');
            if (api) {
              api.getContentPane().prepend('<li url="'+url+'" type="'+type+'" class="'+(add?'added':'')+'"><h4>'+this.layers[url].name+'</h4><span><p>by <a target="_blank" href="'+this.layers[url].source_url+'">'+this.layers[url].source_name+'</a></p>'+
              ((!locked)?'<a class="remove_layer">| Remove</a>':'')+
              '</span><a class="add_layer_link">'+(add?'ADDED':'ADD')+'</a><div class="slider"></div></li>');
              api.reinitialise();  
            }
      		  
      		  var me = this;
      		  
      		  //Opacity slider
      		  $('div#layer_window ul li div.slider').slider({
      		    max:10,
      		    min:1,
      		    step:1,
      		    value: opacity,
      		    range:'min',
      		    slide: function(event,ui) {
      		      var url = $(this).closest('li').attr('url');
      		      me.layers[url].opacity = ui.value/10;
      		      me.layers[url].layer.opacity = ui.value/10;
      		    }
      		  });
  		    } else {
  		      this.importation_errors++;
  		    }
  		  }
  		}
  		
  		
  		
  		/*========================================================================================================================*/
  		/* Add or remove a layer from the list */
  		/*========================================================================================================================*/
  		LayerCustomization.prototype.addRemoveLayer = function(url,type,added) {
  		  if (type == 'kml') {
  		    this.layers[url].layer.setMap((added)?map:null);
  		  } else {
  		    this.sortLayers();
  		  } 
  		}
  		
  		
  		
  		/*========================================================================================================================*/
  		/* Remove a layer from the list and map */
  		/*========================================================================================================================*/
  		LayerCustomization.prototype.removeLayer = function(url,type) {
        if (type == 'kml') {
          try {
            this.layers[url].layer.setMap(null); 
            delete this.layers[url];
          } catch (e) {}
        } else {
          var array = map.overlayMapTypes.getArray();
          for (var i in array) {
            if (this.layers[url].layer == array[i]) {
              map.overlayMapTypes.removeAt(i);
              delete this.layers[url];
              break;
            }
          }
          this.sortLayers();
        } 
        $('div#layer_window ul li[url="'+url+'"]').remove();
  		}
  		
  		


  		/*========================================================================================================================*/
  		/* Sort layers list */
  		/*========================================================================================================================*/
  		LayerCustomization.prototype.sortLayers = function() {
  		  var me = this;
  		  var size = $('div#layer_window ul li[type="xyz"].added').size();
  		  map.overlayMapTypes.clear();
  		  $('div#layer_window ul li[type="xyz"].added').reverse(function(i,element) {
  		    var url = $(element).attr('url');
  		    var added = $(element).hasClass('added');
          map.overlayMapTypes.push(me.layers[url].layer);
          me.layers[url].position = size-i-1;
  		  });
  		}
  		
  		
  		
  		/*========================================================================================================================*/
  		/* Open layers window */
  		/*========================================================================================================================*/
      function openLayers(event) {
        event.stopPropagation();
        event.preventDefault();
        changeApplicationTo();
        if (!$('a.layer').hasClass('selected')) {
          $('#layer_window').fadeIn();
          $('a.layer').addClass('selected');
          $('body').click(function(event) {
  			    if (!$(event.target).closest('#layer_window').length) {
			        $('#layer_window').fadeOut();
              $('a.layer').removeClass('selected');
							$('body').unbind('click');
							$(document).unbind('keydown');
  			    }
  				});
  				$(document).keydown(function (e) {
            if (e.keyCode == 27) { // ESC
              $('#layer_window').fadeOut();
              $('a.layer').removeClass('selected');
							$('body').unbind('click');
              $(document).unbind('keydown');
            }
          });
        }
      }
      
      
      
      /*========================================================================================================================*/
  		/* Close layers window */
  		/*========================================================================================================================*/
      function closeLayers(event) {
        event.stopPropagation();
        event.preventDefault();
        $('#layer_window').fadeOut();
        $('a.layer').removeClass('selected');
        $('body').unbind('click');
      }
      
      
      jQuery.fn.reverse = function(fn) {       
         var i = this.length;
         while(i) {
           i--;
           fn.call(this[i], i, this[i]);
         }
      };


  		
    		
    		
    		