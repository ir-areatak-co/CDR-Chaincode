/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Call, CallStatus } from './call';
import { CallEvents } from './events'
import { createHash as hash } from "crypto";

@Info({title: 'CdrContract', description: 'My Smart Contract' })
export class Cdr extends Contract {

    @Transaction()
    public async CreateCallStart(
        ctx: Context, 
        senderOperator: string, 
        callerId: string, 
        callReceiverId: string, 
        startedAt: string) {
            // get transaction sender CN
            const transactionSender = ctx.clientIdentity.getX509Certificate().subject.commonName

            // Create a Call object
            let call = new Call()
            call = {
                receiverOperator: transactionSender,
                senderOperator,
                callerId,
                callReceiverId,
                startedAt,
                endedAt: null,
                status: CallStatus.StartCreated
            }
            const callId = this.getHash(call)
            const callBuffer = Buffer.from(JSON.stringify(call));

            // Put new state
            await ctx.stub.putState(callId, callBuffer)

            // raise event
            const eventBuffer = Buffer.from(JSON.stringify({ callId, ...call }))
            ctx.stub.setEvent(CallEvents.callStartCreated, eventBuffer)
    }

    // Private Methods
    private getHash(data) {
        return hash("SHA256")
            .update(JSON.stringify(data))
            .digest("hex")
            .substring(0, 7);
    }

}
