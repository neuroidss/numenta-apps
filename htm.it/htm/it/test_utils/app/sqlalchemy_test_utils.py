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

"""Repository object utilities for tests."""

from htmengine.test_utils.repository_test_utils import ManagedTempRepositoryBase

from htm.it.app import repository

ENGINE = repository.getUnaffiliatedEngine()



def getAllDatabaseNames():
  """ Returns `tuple()` of available database names, result of `SHOW DATABASES`
  SQL query.
  """
  with ENGINE.connect() as connection:
    databaseNames = tuple(x[0] for x in
                          connection.execute("SHOW DATABASES").fetchall())
    return databaseNames



class ManagedTempRepository(ManagedTempRepositoryBase):
  """ Context manager that on entry patches the respository database name with
  a unique temp name and creates the repository; then deletes the repository on
  exit.

  This effectively redirects repository object transactions to the
  temporary database while in scope of ManagedTempRepository.

  It may be used as a context manager or as a function decorator (sorry, but
  no class decorator capability at this time)

  Context Manager Example::

      with ManagedTempRepository(clientLabel=self.__class__.__name__) as repoCM:
        print repoCM.tempDatabaseName
        <do test logic>

  Function Decorator Example::

      @ManagedTempRepository(clientLabel="testSomething", kw="tempRepoPatch")
      def testSomething(self, tempRepoPatch):
        print tempRepoPatch.tempDatabaseName
        <do test logic>

  """

  def initTempDatabase(self):
    """Initialize the temporary repository database with default schema and
    contents
    """
    repository.reset()
