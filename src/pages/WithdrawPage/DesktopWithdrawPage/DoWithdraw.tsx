import React from "react";
import {
  Box,
  Container,
  Grid,
  Text,
  Textarea,
  Input,
  Button,
  Spinner,
} from "theme-ui";
import { GrayBox } from "components/GrayBox";
import { useTranslation } from "react-i18next";
import { RelayerOption } from "hooks/useRelayer";
import {
  NoteList,
  NoteListMode,
  DepositListGlobal,
} from "components/DepositList";
import { PoofKitGlobal } from "hooks/usePoofKit";
import { getPoofEvents } from "utils/getPoofEvents";
import { Note } from "@poofcash/poof-kit";

interface IProps {
  onWithdrawClick: () => void;
  setNote: (note: string) => void;
  note: string;
  setRecipient: (recipient: string) => void;
  recipient: string;
  setTxHash: (txHash: string) => void;
  selectedRelayer?: RelayerOption;
  setSelectedRelayer: (relayer?: RelayerOption) => void;
  relayerOptions?: Array<RelayerOption>;
  usingCustomRelayer: boolean;
  setUsingCustomRelayer: (usingCustomRelayer: boolean) => void;
  customRelayer?: RelayerOption;
  setCustomRelayer: (relayerOption?: RelayerOption) => void;
  relayerFee: string;
}

export const DoWithdraw: React.FC<IProps> = ({
  setNote,
  selectedRelayer,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const { poofKit, poofKitLoading } = PoofKitGlobal.useContainer();
  const [address, setAddress] = React.useState<string>();
  const [notes, setNotes] = React.useState<string>();
  const [notesLeft, setNotesLeft] = React.useState(0);
  const { deposits } = DepositListGlobal.useContainer();

  React.useEffect(() => {
    if (deposits && deposits?.length > 0) {
      setNotes(deposits.map((d) => d.note.toNoteString()).join("\n"));
    }
  }, [deposits]);

  const handleWithdraw = async (note: string) => {
    if (!selectedRelayer) {
      alert("Relayer is undefined");
      return;
    }

    if (poofKitLoading) {
      alert("Poof kit is still loading");
      return;
    }
    console.log(note);
    setLoading(true);
    try {
      const depositEvents = (await getPoofEvents("Deposit", poofKit))[
        Note.getInstance(note)
      ];
      const txHash = await poofKit?.withdrawNote(
        note,
        "0",
        address || "",
        selectedRelayer.url,
        depositEvents
      );
      if (txHash) {
        //setTxHash(txHash);
        //onWithdrawClick();
        console.log(txHash);
      } else {
        console.error(
          "No response from relayer. Check your account in the explorer or try again"
        );
      }
    } catch (e) {
      if (e.response) {
        console.error(e.response.data.error);
      } else {
        console.debug(e);
        console.error(e.message);
      }
    }
  };

  const doWithdraw = async () => {
    setLoading(true);
    const notesArray = deposits?.map((d) => d.note.toNoteString()) ?? [];
    let numNotes = notesArray.length;
    for (let i = 0; i < notesArray?.length; i++) {
      setNotesLeft(numNotes--);
      await handleWithdraw(notesArray[i]);
    }
    setLoading(false);
  };

  let boxContent = (
    <>
      <Text sx={{ mb: 4 }} variant="subtitle">
        {t("withdraw.desktop.specify.title")}
      </Text>
      <br />
      <Text variant="regularGray">
        {t("withdraw.desktop.specify.subtitle")}
      </Text>
    </>
  );
  // if (isValidNote(note)) {
  //   boxContent = (
  //     <>
  //       <SummaryTable
  //         lineItems={[
  //           {
  //             label: "Withdrawal Amount",
  //             value: `${humanFriendlyNumber(amount)} ${formatCurrency(
  //               currency
  //             )}`,
  //           },
  //           {
  //             label: `Relayer Fee - ${selectedRelayer?.relayerFee}%`,
  //             value: `- ${humanFriendlyNumber(relayerFee)} ${formatCurrency(
  //               currency
  //             )}`,
  //           },
  //           { label: "Protocol Fee", value: `0 ${formatCurrency(currency)}` },
  //         ]}
  //         totalItem={{
  //           label: "Total",
  //           value: `${humanFriendlyNumber(
  //             finalWithdrawAmount
  //           )} ${formatCurrency(currency)}`,
  //         }}
  //       />
  //     </>
  //   );
  // }

  return (
    <Grid sx={{ gridTemplateColumns: "1.3fr 1fr", gridGap: 6 }}>
      {loading ? (
        <>
          <Spinner />
          <Text sx={{ display: "block" }} variant="title">
            {notesLeft} notes left
          </Text>
          <Text sx={{ display: "block", mb: 4 }} variant="regularGray">
            Withdrawing to address {address}. Refresh the page if this address
            is incorrect!
          </Text>
        </>
      ) : (
        <Container>
          <Text sx={{ display: "block" }} variant="title">
            {t("withdraw.desktop.title")}
          </Text>
          <Text sx={{ display: "block", mb: 4 }} variant="regularGray">
            {t("withdraw.desktop.subtitle")}
          </Text>
          <Input
            placeholder="Recipient Address"
            onChange={(e) => setAddress(e.target.value)}
            value={address}
            mb={2}
          />
          <Textarea
            mb={2}
            disabled={loading}
            name="note"
            placeholder="Enter magic passwords, separated by a new line"
            onChange={(e) => setNotes(e.target.value)}
            value={notes}
            autoComplete="off"
            rows={25}
          />
          <Button onClick={doWithdraw}>Withdraw All</Button>
        </Container>
      )}
      <Container>
        <GrayBox>{boxContent}</GrayBox>
        <Box>
          <NoteList mode={NoteListMode.DEPOSITS} onFill={setNote} />
        </Box>
      </Container>
    </Grid>
  );
};
