/* ----------------------------------------------------------------------
 * Numenta Platform for Intelligent Computing (NuPIC)
 * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero Public License for more details.
 *
 * You should have received a copy of the GNU Affero Public License
 * along with this program.  If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * ---------------------------------------------------------------------- */

(function() {

    HTMITUI.WelcomeView = Backbone.View.extend({

        template: _.template($('#welcome-tmpl').html()),

        msgs: HTMITUI.msgs('welcome-tmpl'),
        site: HTMITUI.msgs('site'),

        events: {
            'change #novice' : 'handleNoviceSelected',
            'change #expert' : 'handleExpertSelected',
            'click #next'    : 'handleNext'
        },

        initialize: function(options) {
            var me = this;
            me.api = options.api;

            HTMITUI.utils.title(me.msgs.title);

            // deactive header logo link
            $('.navbar-brand').attr('href', '#');

            // redirects
            if(HTMITUI.utils.isAuthorized()) {
                // logged in, and not in setup flow => manage page
                if(! HTMITUI.utils.isSetupFlow()) {
                    HTMITUI.utils.go(me.site.paths.manage);
                    return;
                }
                me.getRegions();
            }
            else {
                // logged out
                me.api.getSettings(
                    me.api.CONST.SETTINGS.SECTIONS.USERTRACK,
                    function(error, settings) {
                        if(error) return HTMITUI.utils.modalError(error);
                        if(
                            (! HTMITUI.utils.isSetupFlow()) &&
                            settings &&
                            ('optin' in settings) &&
                            (settings.optin !== '')
                        ) {
                            // setup already => auth page to login
                            HTMITUI.utils.go(me.site.paths.auth);
                            return;
                        }
                        me.getRegions();
                    }
                );
            }
        },

        getRegions: function() {
            var me = this;

            me.api.getRegions(function(error, regions) {
                if(error) return HTMITUI.utils.modalError(error);

                Object.keys(regions).forEach(function(region) {
                    regions[region] = regions[region].replace(' Region', '');
                });

                me.regions = regions;
                me.render();
            });
        },

        render: function() {
            var me = this,
                data = {
                    baseUrl: NTA.baseUrl,
                    msgs: me.msgs,
                    button: me.site.buttons.next,
                    site: me.site,
                    edition: HTMITUI.product.edition,
                    version: HTMITUI.product.version,
                    regions: me.regions,
                    currentRegion: HTMITUI.instanceData.region
                };

            me.$el.html(me.template(data));

            me.trigger('view-ready');
            return me;
        },

        handleNoviceSelected: function(event) {
            var $region = $("#region");
            $region.removeAttr("disabled");
        },

        handleExpertSelected: function(event) {
            var $region = $("#region");
            $region.attr("disabled", "disabled");
        },

        handleNext: function(event) {
            event.preventDefault();
            event.stopPropagation();

            var expert = $("#expert").is(":checked");

            if (expert) {
                HTMITUI.utils.go(this.site.paths.register +
                                this.site.urltag.setup +
                                this.site.urltag.expert);
            }
            else {
                var region = $("#region").val();

                HTMITUI.utils.go(this.site.paths.register +
                                this.site.urltag.setup +
                                this.site.urltag.region + region);
            }
        }
    });

})();
