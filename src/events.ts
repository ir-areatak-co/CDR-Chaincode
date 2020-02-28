/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class CallEvents {

  // Events' Names
  @Property()
  public static callStartCreated = 'CALL_START_CREATED'
  public static callStartAccepted = 'CALL_START_ACCEPTED'
  public static callEnded = 'CALL_ENDED'

}
