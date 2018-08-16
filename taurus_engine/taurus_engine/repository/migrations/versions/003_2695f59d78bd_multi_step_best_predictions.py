# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2016, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero Public License for more details.
#
# You should have received a copy of the GNU Affero Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------

"""Adds multi_step_best_predictions column to metric_data table.

Revision ID: 2695f59d78bd
Revises: a60d03066072
Create Date: 2016-08-08 13:28:15.851769
"""

from alembic import op
import sqlalchemy as sa


# Revision identifiers, used by Alembic. Do not change.
revision = '2695f59d78bd'
down_revision = 'a60d03066072'



def upgrade():
    """ Adds column 'multi_step_best_predictions' to metric_data table """
    op.add_column('metric_data', sa.Column('multi_step_best_predictions',
                                           sa.TEXT(), nullable=True))



def downgrade():
    raise NotImplementedError("Rollback is not supported.")
