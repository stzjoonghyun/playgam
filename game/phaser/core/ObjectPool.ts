/**
 * 제네릭 오브젝트 풀.
 * 슈터의 총알, 러너의 장애물, 클리커의 파티클 등
 * "많이 생성/파괴되는 객체"를 재사용해 GC 부담과 프레임 드랍을 줄인다.
 *
 * Phaser에도 Group.get()이 있지만, 순수 데이터 객체나 커스텀 클래스에는
 * 이런 범용 풀이 더 편하다.
 *
 * 사용 예:
 *   const bulletPool = new ObjectPool(
 *     () => new Bullet(scene),      // 생성 팩토리
 *     (b) => b.reset(),             // 반납 시 초기화
 *   );
 *   const b = bulletPool.acquire(); // 꺼내 쓰기
 *   bulletPool.release(b);          // 다 쓰면 반납
 */
export class ObjectPool<T> {
  private available: T[] = [];
  private factory: () => T;
  private resetFn?: (item: T) => void;

  constructor(factory: () => T, resetFn?: (item: T) => void, preallocate = 0) {
    this.factory = factory;
    this.resetFn = resetFn;
    // 미리 만들어두면 게임 중 첫 생성 스파이크를 피할 수 있다
    for (let i = 0; i < preallocate; i++) {
      this.available.push(this.factory());
    }
  }

  /** 풀에서 하나 꺼낸다. 없으면 새로 만든다 */
  acquire(): T {
    const item = this.available.pop() ?? this.factory();
    return item;
  }

  /** 다 쓴 객체를 풀에 반납한다 */
  release(item: T): void {
    this.resetFn?.(item);
    this.available.push(item);
  }

  get size(): number {
    return this.available.length;
  }
}
