/*
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
 *
 */

package com.numenta.core.service;

/**
 * Generic HTM Exception
 */
public class HTMException extends Exception {

    private static final long serialVersionUID = -6781138897947837629L;

    /**
     * TODO Document {@link HTMException} constructor
     */
    public HTMException() {
        // TODO Auto-generated constructor stub
    }

    /**
     * TODO Document {@link HTMException} constructor
     *
     * @param detailMessage
     */
    public HTMException(String detailMessage) {
        super(detailMessage);
        // TODO Auto-generated constructor stub
    }

    /**
     * TODO Document {@link HTMException} constructor
     *
     * @param throwable
     */
    public HTMException(Throwable throwable) {
        super(throwable);
        // TODO Auto-generated constructor stub
    }

    /**
     * TODO Document {@link HTMException} constructor
     *
     * @param detailMessage
     * @param throwable
     */
    public HTMException(String detailMessage, Throwable throwable) {
        super(detailMessage, throwable);
        // TODO Auto-generated constructor stub
    }

}
