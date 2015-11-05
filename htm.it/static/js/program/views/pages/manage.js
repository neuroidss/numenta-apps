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

    HTMITUI.ManageView = Backbone.View.extend({

        template: _.template($('#manage-tmpl').html()),

        msgs: HTMITUI.msgs('manage-tmpl'),
        site: HTMITUI.msgs('site'),

        events: {
        },

        initialize: function(options) {
            this.api = options.api;

            HTMITUI.utils.title(this.msgs.title);

            // go setup if they have not yet
            if(! HTMITUI.utils.isAuthorized()) {
                HTMITUI.utils.go(this.site.paths.welcome);
                return;
            }

            this.render();
        },

        render: function() {
            var data = {
                    baseUrl: NTA.baseUrl,
                    msgs: this.msgs,
                    site: this.site
                },
                instanceListView = null,
                embedView = null;

            this.$el.html(this.template(data));

            instanceListView = new HTMITUI.InstanceListView({
                el:     $('#instance-list'),
                api:    this.api,
                site:   this.site
            });
            instanceListView.render();

            embedView = new HTMITUI.EmbedFormView({
                el: $('#embed-form'),
                api: this.api
            });
            embedView.render();

            this.trigger('view-ready');
            return this;
        }

    });

})();
