import { Modal, Button, Text, VStack } from 'native-base'

type Props = {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  currentStoreName?: string
}

export function CartConflictModal({
  isOpen,
  onCancel,
  onConfirm,
  currentStoreName,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <Modal.Content maxWidth="90%">
        <Modal.CloseButton />

        <Modal.Header>Trocar de loja?</Modal.Header>

        <Modal.Body>
          <VStack space={3}>
            <Text>
              Você já possui um carrinho ativo
              {currentStoreName ? ` na loja ${currentStoreName}` : ''}.
            </Text>

            <Text>
              Ao continuar, o carrinho atual será esvaziado e um novo carrinho
              será criado para esta loja.
            </Text>

            <Text fontWeight="bold">Deseja continuar mesmo assim?</Text>
          </VStack>
        </Modal.Body>

        <Modal.Footer>
          <Button.Group space={2}>
            <Button variant="outline" colorScheme="coolGray" onPress={onCancel}>
              Cancelar
            </Button>

            <Button colorScheme="red" onPress={onConfirm}>
              Trocar de loja
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  )
}
