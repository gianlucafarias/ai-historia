import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { FaTwitter } from "react-icons/fa";
import Beatloader from "react-spinners/BeatLoader";
import base64ToBlob from "@/utils/basetoblob";
import {
  Box,
  Button,
  HStack,
  Heading,
  Icon,
  Text,
  Textarea,
  VStack,
  useToast,
  useColorModeValue,
  Link,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Grid,
  Skeleton
} from "@chakra-ui/react";
import { handleEnterKeyPress } from "@/utils";
import NameInput from "@/components/NameInput";
import { Message } from "@/types";


function Home() {
  // ref need to play audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // storing array messages in state
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // tracking user input
  const [text, setText] = useState("");

  const handleCardClick = (question: string) => {
    setText(question);
  };

  const shuffleArray = (array: any) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const getRandomSuggestedQuestions = () => {
    // Crea una copia del arreglo original de preguntas sugeridas
    const shuffledQuestions = shuffleArray([...suggestedQuestions]);
    // Devuelve las primeras 3 preguntas de la copia desordenada
    return shuffledQuestions.slice(0, 3);
  };

  // function to execute api request and communicate with open ai, pinecone & eleven labs
  const askAi = async (props?: { name?: string; }) => {

    if (!userName && !props?.name)
      return toast({
        title: "¡Ingresa tu nombre primero!",
        status: "error",
      });

    const message = { role: "user", content: text };

    if (!props?.name) {
      addMessage({ role: "user", content: text });
      setText("");
    }

    if (!audioRef.current)
      return toast({ title: "Error enabling audio", status: "error" });

    setLoading(true);

    const reqBody = {
      messages: props?.name ? undefined : [...messages, message],
      userName: userName || props?.name,
    };

    console.log("api reqBody:", reqBody);

    // response for chat gpt
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Accept: "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    const jsonResp = await response.json();

    console.log("api jsonResp response:", jsonResp);

    const { audioDataBase64, translatedText } = jsonResp;

    addMessage({ role: "assistant", content: translatedText });
    setSuggestedQuestions(suggestedQuestions);
    const audioBlob = base64ToBlob(audioDataBase64, "audio/mpeg");
    const audioURL = URL.createObjectURL(audioBlob);

    audioRef.current.src = audioURL;
    await audioRef.current.play();

    setText("");

    try {
      setLoading(false);
    } catch (e: any) {
      console.log("Error:", e.message);
    }
  };

  // this is a hack to allow mobile browsers to play audio without user interaction
  const startAudioForPermission = async () => {
    if (!audioRef.current) return;
    await audioRef.current.play();
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
  }, []);

  const userBgColor = useColorModeValue("green.500", "green.300");
  const assistantBgColor = useColorModeValue("gray.100", "gray.700");
  const userColor = "white";
  const assistantColor = "black";
  const [userName, setUserName] = useState<null | string>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "¿Quién fue el intendente de Ceres en 1980?",
    "¿Cuándo se fundó la ciudad de Ceres?",
    "¿Cuáles son los principales eventos históricos de Ceres?",
    "¿Cuando se fundó el Club Atlético Ceres Unión?",
    "¿Cual es la principal actividad economica de la ciudad?",
    "¿Cuando se fundó el Club Central Argentino Olimpico?",
    "¿Quién es el intendente de Ceres actualmente?",
    "¿Quiénes fueron los primeros pobladores de Ceres?",

  ]);
  const assistantName = "HistoriBot";
  const [randomSuggestedQuestions, setRandomSuggestedQuestions] = useState([]);
  useEffect(() => {
    setRandomSuggestedQuestions(getRandomSuggestedQuestions());
  }, []);

  return (
    <>
      <Head>
        <title>HistoriBot - Historia sobre la ciudad de Ceres</title>
      </Head>
      <VStack pt={40} px={4} mb={100} spacing={4} maxW="600px" mx="auto">
        <Heading as="h1" color="black">
        HistoriBot
        </Heading>
        <Text color="black" as="i" fontSize="xs" mb={5}>
          Podes preguntarle sobre datos históricos de la ciudad de Ceres, Santa Fe. Creado por @GianlucaFarias.{" "}
          <Link
            href="https://twitter.com/gianlucafarias"
            color="#1DA1F2"
            isExternal
          >
            <Icon as={FaTwitter} fontSize="md" />
          </Link>
        </Text>

        {!userName ? (
          <NameInput
            onEnter={(name) => {
              startAudioForPermission();
              setUserName(name);
              askAi({ name });
            }}
          />
        ) : (
          <>
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              <audio ref={audioRef} />;
              return (
                <Box
                  key={index}
                  alignSelf={isUser ? "flex-end" : "flex-start"}
                  backgroundColor={isUser ? userBgColor : assistantBgColor}
                  color={isUser ? userColor : assistantColor}
                  borderRadius="lg"
                  px={4}
                  py={2}
                  mb={3}
                  maxWidth="70%"
                  position="relative"
                >
                  <Text
                    fontSize="xs"
                    position="absolute"
                    color="black"
                    top={-5}
                    left={1}
                  >
                    {isUser ? userName : assistantName}
                  </Text>
                  <Text fontSize="sm">{message.content}</Text>
                </Box>
              );
            })}
            
            <Flex wrap="wrap" justify="center" gap={4}>
            <Grid templateColumns='repeat(3, 1fr)' gap={6}>
                {randomSuggestedQuestions.map((question, index) => (
                <Skeleton key={index} isLoaded={!loading && messages.length > 0}>
                <Card
                  key={index}
                  variant="outline"
                  cursor="pointer"
                  
                  onClick={() => handleCardClick(question)}
                >
                  <CardBody>
                    <Heading size='xs' textTransform='uppercase'>Preguntar</Heading>
                    <Text pt='2' fontSize='sm'>{question}</Text>
                  </CardBody>
                </Card>
                </Skeleton>
              ))}
              </Grid>
            </Flex>
            
            <VStack w="100%" spacing={4}>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleEnterKeyPress(() => {
                  askAi();
                })}
              />
            </VStack>

            <HStack w="100%" spacing={4}>
              <Button
                h={9}
                variant="outline"
                onClick={() => {
                  askAi();

                  window.scrollTo({
                    left: 0,
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                  });
                }}
                isLoading={loading}
                spinner={<Beatloader size={8} />}
              >
                Enviar
              </Button>
            </HStack>
          </>
        )}
      </VStack>
    </>
  );
}

export default Home;
