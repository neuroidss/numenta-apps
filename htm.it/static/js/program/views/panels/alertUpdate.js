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

    HTMITUI.AlertUpdateView = Backbone.View.extend({

        template: _.template($('#alert-update-tmpl').html()),

        msgs: HTMITUI.msgs('alert-update-tmpl'),
        site: HTMITUI.msgs('site'),

        events: {
            'click button': 'handleButtonClick'
        },

        initialize: function(options) {
            this.api = options.api;
            this.render();
        },

        render: function() {
            var data = {
                    baseUrl: NTA.baseUrl,
                    msgs: this.msgs,
                    site: this.site
                };

            this.$el.html(this.template(data));

            this.$el.parent().toggleClass('off alert-warning');

            this.trigger('view-ready');
            return this;
        },

        handleButtonClick: function(event) {
            var me = this;
            me.api.setUpdate(function(error) {
                if(error) return HTMITUI.utils.modalError(error);
                HTMITUI.utils.store.clear('originalHTMITSHA');
                HTMITUI.utils.go(me.site.paths.update);
            });
        }

    });

})();
