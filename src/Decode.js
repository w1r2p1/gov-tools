import React, { useState } from "react";
import { ethers } from "ethers";
import { Card, Button, Form, Table } from "react-bootstrap";
import { Spacer } from "./Spacer";
import abiDecoder from "abi-decoder";

import masterchefAbi from "./abi/masterchef.json";
import timelockAbi from "./abi/timelock.json";
import gnosisSafeAbi from "./abi/gnosis.json";

abiDecoder.addABI(timelockAbi);
abiDecoder.addABI(masterchefAbi);
abiDecoder.addABI(gnosisSafeAbi);

// https://github.com/abstracted-finance/pickle-txs-wtf/blob/master/components/main.tsx
const specialFunctionNames = [
  "queueTransaction",
  "cancelTransaction",
  "executeTransaction",
];

function Decode() {
  const [txData, setTxData] = useState("");
  const [decodedTx, setDecodedTx] = useState({});

  const invalidTxData = decodedTx instanceof Error;

  return (
    <>
      <Spacer y={15} />
      <Card>
        <Card.Body>
          <Form>
            <Form.Group>
              <Form.Label>Data (hex encoded)</Form.Label>
              <Form.Control
                as="textarea"
                rows="3"
                value={txData}
                onChange={(e) => setTxData(e.target.value)}
              />
            </Form.Group>

            <Button
              block
              onClick={(e) => {
                e.preventDefault();

                try {
                  const decodedFunction = abiDecoder.decodeMethod(txData);

                  if (specialFunctionNames.includes(decodedFunction.name)) {
                    // target, value, signature, data, eta
                    const signature = decodedFunction.params[2].value;
                    const data = decodedFunction.params[3].value;

                    const functionParams = signature
                      .split("(")[1]
                      .split(")")[0]
                      .split(",");

                    const decodedData = ethers.utils.defaultAbiCoder.decode(
                      functionParams,
                      data
                    );

                    decodedFunction.params[3].value =
                      "[" +
                      decodedData.map((x) => x.toString()).join(", ") +
                      "]";
                  }

                  setDecodedTx(decodedFunction);
                } catch (e) {
                  setDecodedTx(e);
                }
              }}
            >
              Decode
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Spacer y={15} />

      <Card>
        <Card.Body>
          <h4>Decoded Tx</h4>
          {invalidTxData && "Error decoding tx data"}

          {!invalidTxData && decodedTx.params && (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Param</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>function</td>
                  <td>{decodedTx.name}</td>
                </tr>
                {decodedTx.params.map((x) => {
                  return (
                    <tr>
                      <td>{x.name}</td>
                      <td>{x.value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  );
}

export default Decode;
