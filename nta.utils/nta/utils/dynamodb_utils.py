# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
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

from nta.utils import error_handling
from boto.dynamodb2.exceptions import ProvisionedThroughputExceededException



def retryOnTransientDynamoDBError(logger):
  """ Decorator helper for retrying dynamodb operations that failed due to
  transient errors

  :params logging.Logger logger: Logger instance
  :returns: Function decorator configured to retry in the event of dynamodb
    ProvisionedThroughputExceededException exceptions
  """
  return error_handling.retry(
    timeoutSec=10, initialRetryDelaySec=0.5, maxRetryDelaySec=2,
    retryExceptions=(ProvisionedThroughputExceededException,),
    logger=logger
  )
