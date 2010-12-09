
			/*==========================================================================================================================*/
			/*  																																																												*/
			/*									MergeOperations => Operations with merging data between sources																					*/
			/*																types: 																																										*/
			/*																				Uploading																																					*/
			/*																				Importing																																					*/
			/*																				Refreshing																																				*/
			/*  																																																												*/
			/*==========================================================================================================================*/			


			function MergeOperations(sources) {
				this.gbif_points = [];
				this.flickr_points = [];
				this.your_points = [];
				this.sources = sources;
			}



			/*============================================================================*/
			/*  Check the sources points for merge later.																	*/
			/*============================================================================*/
			MergeOperations.prototype.checkSources = function() {
				if (this.sources.length>0) {
					var me = this;
					setTimeout(function(ev){
						me.requestPoints(0);
					},1000);
				}
			}
		

		
			/*============================================================================*/
			/*  Get the sources included in the tool.																			*/
			/*============================================================================*/
			MergeOperations.prototype.requestPoints = function(count) {
				var me = this;
				if (this.sources[count]=="your") {
					count++;
					try {
						if (this.sources[count]!=undefined) {
							me.requestPoints(count);
						}
					}
					catch (e) {
						activeMerge();
					}
				} else {
					var url = "/search/" + this.sources[count] + '/' + specie.replace(' ','+');
					$.getJSON(url,
							function(result){
								for (var i=0; i<result[0].points.length; i++) {
									if (_markers[result[0].points[i].catalogue_id]==undefined && _markers[result[0].points[i].catalogue_id]==null) {
										if (me.sources[count]=="gbif") {
											me.gbif_points.push(result[0].points[i]);
										} else {
											me.flickr_points.push(result[0].points[i]);
										}
									}
								}
								count++;
								try {
									if (this.sources[count]!=undefined) {
										me.requestPoints(count);
									}
								}
								catch (e) {
									activeMerge();
								}
							}
					);
				}
			}
			
			
			
			/*============================================================================*/
			/*  Import .RLA or .CSV file occurences.																			*/
			/*============================================================================*/
			MergeOperations.prototype.importPoints = function(sources) {
        var me = this;
				
        showMamufasMap();
				
        function asynCheckPoints(count,sources_) {
          if (sources_[count]!=undefined) {
            for (var i=0; i<sources_[count].points.length; i++) {
              var catalogue_id = sources_[count].points[i].catalogue_id;
              if (catalogue_id==null || catalogue_id==undefined) {
                global_id++;
                if (sources_[count].points[i].coordinateUncertaintyInMeters == null || sources_[count].points[i].coordinateUncertaintyInMeters == undefined) 
                  sources_[count].points[i].coordinateUncertaintyInMeters = 15;
                sources_[count].points[i].catalogue_id = 'your_'+global_id;
                me.your_points.push(sources_[count].points[i]);
              } else {
                if (_markers[catalogue_id]==undefined && _markers[catalogue_id]==null) {
                 if (sources_[count].name=="gbif") {
                   me.gbif_points.push(sources_[count].points[i]);
                 } else if (sources_[count].name=="flickr") {
                   me.flickr_points.push(sources_[count].points[i]);
                 } else {
                   me.your_points.push(sources_[count].points[i]);
                 }
                }
              }
            }
            count++;
            setTimeout(function(){asynCheckPoints(count,sources_);},0);
          } else {
            sources_length = sources_.length;
            sources_count=0;
            $('body').bind('hideMamufas', function(ev){
      				sources_count++;
      				if (sources_length==sources_count) {
      					$('body').unbind('hideMamufas');
      					hideMamufasMap(true);
      				}
      			});
            if (me.gbif_points.length>0) {
        			addSourceToMap({points:me.gbif_points},false,true);
            }
            if (me.flickr_points.length>0) {
        			addSourceToMap({points:me.flickr_points},false,true);
            }
            if (me.your_points.length>0) {
              addSourceToMap({points:me.your_points},false,true);
            }
            if (me.gbif_points.length==0 && me.flickr_points.length==0 && me.your_points.length==0) {
    					$('body').unbind('hideMamufas');
    					hideMamufasMap(false);
            }
          }
        }
        asynCheckPoints(0,sources);
			}

			
			
			