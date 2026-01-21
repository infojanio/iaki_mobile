import { Modal, Button, Text, VStack } from 'native-base'

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function CartConflictModal({ isOpen, onClose, onConfirm }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Content>
        <Modal.CloseButton />
        <Modal.Header>Trocar de loja?</Modal.Header>

        <Modal.Body>
          <VStack space={3}>
            <Text>Você já possui um carrinho com produtos de outra loja.</Text>

            <Text fontWeight="bold">
              Deseja limpar o carrinho atual e adicionar este produto?
            </Text>
          </VStack>
        </Modal.Body>

        <Modal.Footer>
          <Button.Group space={3}>
            <Button variant="ghost" onPress={onClose}>
              Cancelar
            </Button>

            <Button colorScheme="red" onPress={onConfirm}>
              Trocar loja
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  )
}
