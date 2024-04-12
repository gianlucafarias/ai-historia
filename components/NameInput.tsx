import React, { useState } from "react";
import { Box, Button, FormControl, FormLabel, Input } from "@chakra-ui/react";
import { handleEnterKeyPress } from "@/utils";

const NameInput = ({ onEnter }: { onEnter: (name: string) => void }) => {
  const [name, setName] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  return (
    <Box width="100%">
      <FormControl id="name" mt={4}>
        <FormLabel>¿Cual es tu nombre?</FormLabel>
        <Input
          type="text"
          value={name}
          onChange={handleChange}
          onKeyDown={handleEnterKeyPress(() => {
            onEnter(name);
          })}
          placeholder="Ingresa tu nombre"
          mb={4}
        />
      </FormControl>
      <Button
        colorScheme="green"
        onClick={() => onEnter(name)}
        isDisabled={!name.trim()}
      >
        Registrarme
      </Button>
    </Box>
  );
};

export default NameInput;
