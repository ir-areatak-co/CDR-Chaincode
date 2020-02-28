/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Call {

    @Property()
    public senderOperator: string;
    public receiverOperator: string;
    public callerId: string;
    public callReceiverId: string;
    public startedAt: string;
    public endedAt: string;
    public duration: number;
    public status: CallStatus

}

export enum CallStatus {
    StartCreated = "START_CREATED",
    StartAccepted = "START_ACCEPTED",
    Ended = "ENDED"
}
