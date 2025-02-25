# EC Testing stand

## User interaction

User interaction type in text is specified in **BOLD**
where interaction text is specified in *italic*

### Check

Check indicates an event where user performed some action and
dapp performs background check on it.

For instance, user transferred EC, and dApp awaits for transaction
to occur in testnet.

Check consists of the following steps

- Check message is displayed to the user with spinner indicator on the righ
- dApp performs background check
- dApp displays check result

In case check result is positive, spinner get's replaced by the tick
and check is saved as passed in the user session.

Otherwise spinner get's replaced by error cross check is considered failed
and user can't proceed any further.
In other words, all checks are mandatory.

Failed check should have **FAILURE** *Description text* among with the Re-try button allowing to re-try the check.

### Prompt

Prompt is kind of like check, except app takes the user word for it.

Use case scenario is when we want user to verify some values are displayed properly in the native wallet interface.

For instance: **PROMPT** *Extra currency balance now displays as 1.23 EC?*

Prompt consists of the following steps:

- Prompt message is displayed to the user with two buttons on the right *Yes*(green)/*No*(red).
- User is expected to answer the prompt
- In case of positive answer prompt is considered successful.

Prompts can be mandatory and optional.
When mandatory prompt receives negative answer, further steps can't be performed.
So user has to fix the issue and reload the testing stand.

In case prompt is optional, negative answer is acceptable and the result is saved for further use in testing scenario.
Prompt is mandatory unless specified explicitly otherwise.

Successful and optional prompt results are saved in user session.

### Error

Error is only displayed when testing wallet doesn't support some crucial feature.

For instance lacks TON Connect or `ton-connect` [sdk](https://github.com/ton-connect/sdk/tree/main/packages/sdk) indicates lack of EC support.

When error is displayed, user can't perform any further testing

### Session

Whole point of a session is that after stand page
reload user could continue from last failed/unanswered **PROMPT** or **CHECK**.

User should be able to clear session in a simple fashion.
Perhaps, by clicking on the `Clean start` button

## Testing

### Contracts

All basic tests are performed
against [ec swap](https://testnet.tonviewer.com/kQC_rkxBuZDwS81yvMSLzeXBNLCGFNofm0avwlMfNXCwoOgr)/[source](https://github.com/ton-blockchain/governance-contract/blob/minter/swap_with_reserve.tolk)
Referenced as *ec_swap* in rest of the document.

### Connect the wallet

In order to connect to the dApp:

- User should click on *Connect Wallet* button
- Wallet should support TON Connect

In case connection is not successful user is presented with **ERROR** *message
describing the issue*

On successful connection dApp should check that extra currency support is present among
TON Connect wallet feature list:

``` typescript

type DeviceInfo = {
  platform: "iphone" | "ipad" | "android" | "windows" | "mac" | "linux";
  appName:      string; // e.g. "Tonkeeper"  
  appVersion:  string; // e.g. "2.3.367"
  maxProtocolVersion: number;
  features: Feature[ extraCurrencySupported ];
}

```

If not, user is presented with the **ERROR** *Extra currency support is not indicated in your wallet features and a [link](https://github.com/ton-blockchain/ton-connect/blob/main/requests-responses.md#initiating-connection)
to the relevant TON Connect document*


If extra currency feature is supported, dApp should display current address, TON and Extra balance.


Before proceeding **OPTIONAL PROMPT** *Does your wallet support emulation?"

Perhaps there should be toggle somewhere on the page instead?

On positive prompt, all **Emulation supported** cases should
be executed in additon to **No emulation**.

### Optional EC top up

In case current EC balance of wallet is 0, user is requested to top up
the wallet with test EC via clicking `Get test EC` button.

In case user has less than 3.25 test TON balance, button should become
unclickable with text `At least 3.25` ton required.

Cyclic **CHECK** *Please top up wallet TON balance* till the user tops up.

On click, dapp should send 3 TON + random dust within the range of user balance with minimal step of 0.01 TON and value at lest 0.1
to the *ec_swap* in PAY_FEES_SEPARATELY mode.

Total value >= 3.1

Sending 3.1 TON to *ec swap* will result in user getting at least 1 test extra currency.

#### Emulation supported

In case emulation supported by wallet:

dApp should deduce expected EC - *X* and excess TON - *Y* via one or the other emulation API.

**PROMPT** *Wallet emulation displayed incoming X extra and Y TON excess?*

#### No emulation

After payload is sent, dApp should wait for incoming TX from the testing wallet on the
*ec swap contract* and check that it returns expected amount of EC and TON.

**CHECK** *Requesting X test extra currency*

- In case tx failed, display **FAILURE** *Transaction failed* and a link to failed tx
- In case tx didn't happen within 60 sec, display **FAILURE** *Transaction is taking too long*


### Extra currency balance verification

dApp should check the testing wallet EC balance onchain - *X* and:

**PROMPT** *Wallet interface displays X extra currency?*

### Checking the ability to send extra currency via TON Connect

- dApp should pick random ec value within 10% of total wallet extra currency balance range no less that 0.01 EC - *X*
- dApp should send it back to *ec_swap* in PAY_FEES_SEPARATELY mode and 0 TONs attached via TON Connect

#### Emulation supported

**PROMPT** *Wallet emulation displayed outgoing X extra currency?*

### No emulation

dApp should check if wallet sent appropriate amount of EC to the destination address.

**CHECK** *Sending X extra...*

- In case unexpected amount *Y* was sent instead, **FAILURE** *Y extra was sent instead of X tx link*
- In case tx didn't happen within 60 sec, display **FAILURE** *Transaction is taking too long*

### Checking the ability to send extra currency natively using wallet interface

dApp should pick random ec value within 10% of total wallet extra currency balance range no less that 0.01 EC - *X*

**PROMPT** *Please send X extra currency to (ec_swap address) using wallet interface* **Done**

dApp should check that the amount X was sent to *ec_swap*

**CHECK** *Waiting for X extra to be sent to ec_swap...*

- In case unexpected amount *Y* was sent instead, **FAILURE** *Y extra was sent instead of X tx link*
- In case tx didn't happen within 5 min?, display **FAILURE** *Transaction is taking too long*

## Done

**SUCCESS** Congrats! Basic extra currency functionality is supported!

## TODO

- EC Meta verification in wallet UI besides decimals?
- More complex scenario like swap where TON needs to be attached to the EC value?
