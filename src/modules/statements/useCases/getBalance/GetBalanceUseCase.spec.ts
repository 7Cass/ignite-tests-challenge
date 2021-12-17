import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let getBalanceUseCase: GetBalanceUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Get User Balance", () => {

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
  });

  it("Should be able to get user's account balance", async () => {
    const user: ICreateUserDTO = {
      name: "Test User",
      email: "user@test.com",
      password: "password"
    };

    await createUserUseCase.execute(user);

    const token = await authenticateUserUseCase.execute({ email: user.email, password: user.password });

    await createStatementUseCase.execute({
      user_id: token.user?.id as string,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Desposit - $100"
    });

    await createStatementUseCase.execute({
      user_id: token.user?.id as string,
      type: OperationType.WITHDRAW,
      amount: 50,
      description: "Withdraw - $50"
    });

    const result = await getBalanceUseCase.execute({
      user_id: token.user?.id as string,
    });

    expect(result).toHaveProperty("balance");
    expect(result.balance).toBeGreaterThan(0);
  });

  it("Should not be able to get the account balance from an inexistent user", () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: "Inexistent Id"
      });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
